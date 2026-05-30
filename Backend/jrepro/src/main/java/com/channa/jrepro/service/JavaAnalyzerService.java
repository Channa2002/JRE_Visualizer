package com.channa.jrepro.service;

import com.channa.jrepro.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.*;

/**
 * Fully rewritten JVM memory simulator.
 *
 * Rules implemented:
 *  - METASPACE : class metadata + all method signatures + static/class-level fields
 *  - STACK     : one frame per active method call; each frame holds ONLY primitives
 *                and object *references* (not the objects themselves)
 *  - HEAP      : every object created with `new` lives here, keyed by address (@1000…)
 *
 * The simulator walks the source line-by-line, maintains live state, and emits
 * one ExecutionStep per meaningful event so the UI can step through it.
 */
@Service
public class JavaAnalyzerService {

    // ── heap address counter ────────────────────────────────────────────────
    private int nextAddr = 1000;
    private String nextAddr() { return "@" + nextAddr++; }

    // ═══════════════════════════════════════════════════════════════════════
    // Public entry point
    // ═══════════════════════════════════════════════════════════════════════

    public AnalyzeResponse analyze(String rawCode) {
        nextAddr = 1000;

        String code        = rawCode;
        String[] rawLines  = code.split("\n");
        List<String> lines = Arrays.asList(rawLines);

        String className  = extractClassName(code);
        String entryMethod = code.contains("public static void main") ? "main"
                           : extractFirstMethodName(code);

        // ── Live memory areas ───────────────────────────────────────────────
        // Metaspace is populated once at class-load time and stays constant.
        List<MetaspaceEntry> metaspace = buildMetaspace(code, className);

        // Heap and stack evolve step-by-step.
        Map<String, HeapObject> heap    = new LinkedHashMap<>();
        Deque<StackFrame>       stack   = new ArrayDeque<>();   // front = top

        List<ExecutionStep> steps = new ArrayList<>();
        int stepNum = 1;

        // ── STEP : Class loading → Metaspace ───────────────────────────────
        steps.add(step(stepNum++, 1,
            "CLASS LOAD → METASPACE: JVM loads class `" + className + "`. " +
            "Class descriptor, method bytecodes, and static fields are written into Metaspace. " +
            "No heap or stack space is used yet.",
            "class " + className + " {", "static_load",
            snapshot(stack, heap, metaspace)));

        // ── STEP : static field initialisation (stays in Metaspace) ────────
        // Update the MetaspaceEntry with runtime values for statics
        MetaspaceEntry mainEntry = metaspace.get(0);
        Map<String, Variable> liveStatics = new LinkedHashMap<>(mainEntry.staticFields());

        Pattern staticInit = Pattern.compile(
            "^\\s*(?:public\\s+|private\\s+|protected\\s+)?static\\s+(?:final\\s+)?(\\w+)\\s+(\\w+)\\s*=\\s*([^;]+);",
            Pattern.MULTILINE);
        Matcher sm = staticInit.matcher(code);
        while (sm.find()) {
            String type = sm.group(1), name = sm.group(2), val = sm.group(3).trim();
            int ln = lineOf(lines, sm.start());
            boolean prim = isPrimType(type);
            // String literals assigned to static → heap object
            String ref = null;
            if (!prim && isStringLiteral(val)) {
                ref = nextAddr();
                heap.put(ref, new HeapObject(ref, "String",
                    Map.of("value", new Variable("value","char[]", stripQuotes(val), true, null)),
                    "string"));
            }
            liveStatics.put(name, new Variable(name, type, prim ? val : (ref != null ? ref : val), prim, ref));
            // Rebuild metaspace with updated statics
            metaspace.set(0, new MetaspaceEntry(mainEntry.className(), mainEntry.methods(), new LinkedHashMap<>(liveStatics), mainEntry.classType()));
            steps.add(step(stepNum++, ln,
                "STATIC INIT → METASPACE: Static field `" + type + " " + name + "` initialised to `" + val + "`. " +
                "Stored in Metaspace as part of the class, NOT on the stack.",
                sm.group().trim(), "static_load",
                snapshot(stack, heap, metaspace)));
        }

        // ── STEP : push entry-method frame onto stack ───────────────────────
        Map<String, Variable> mainLocals = new LinkedHashMap<>();
        int mainLine = findMethodLine(lines, entryMethod);
        StackFrame mainFrame = new StackFrame("frame_" + entryMethod, entryMethod, className, mainLine, mainLocals);
        stack.push(mainFrame);

        steps.add(step(stepNum++, mainLine,
            "METHOD CALL → STACK: JVM pushes a new stack frame for `" + className + "." + entryMethod + "()`. " +
            "The frame will hold the method's local variables and object references.",
            entryMethod + "(", "method_call",
            snapshot(stack, heap, metaspace)));

        // ── Walk the method body ────────────────────────────────────────────
        stepNum = walkMethodBody(lines, code, className, entryMethod,
                                 stack, heap, metaspace, mainLocals,
                                 steps, stepNum, liveStatics);

        // ── STEP : method returns → frame popped ───────────────────────────
        stack.pop();
        int retLine = findReturnLine(lines, entryMethod);
        steps.add(step(stepNum, retLine,
            "METHOD RETURN → STACK: `" + entryMethod + "()` returns. " +
            "Its stack frame is popped and ALL local variables are destroyed. " +
            "Objects on the heap may now become eligible for GC if no references remain.",
            "}", "method_return",
            snapshot(stack, heap, metaspace)));

        return new AnalyzeResponse(
            "JVM Memory Trace: " + className,
            "Step-by-step memory simulation for " + className + "." + entryMethod + "()",
            code, steps, steps.size());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Method body walker
    // ═══════════════════════════════════════════════════════════════════════

    private int walkMethodBody(
            List<String> lines, String code, String className, String methodName,
            Deque<StackFrame> stack, Map<String, HeapObject> heap,
            List<MetaspaceEntry> metaspace, Map<String, Variable> locals,
            List<ExecutionStep> steps, int stepNum,
            Map<String, Variable> liveStatics) {

        boolean inside = false;
        int depth = 0;

        for (int i = 0; i < lines.size(); i++) {
            String raw  = lines.get(i);
            String line = raw.trim();
            int    ln   = i + 1;

            // Detect method opening brace
            if (!inside) {
                if (line.contains(methodName + "(") && (line.endsWith("{") || lines.get(Math.min(i+1, lines.size()-1)).trim().equals("{"))) {
                    inside = true;
                    depth  = 1;
                    continue;
                }
                continue;
            }

            // Track brace depth
            for (char c : line.toCharArray()) {
                if (c == '{') depth++;
                if (c == '}') depth--;
            }
            if (depth <= 0) break;

            // Skip blanks, comments, lone braces
            if (line.isEmpty() || line.startsWith("//") || line.startsWith("/*")
                    || line.equals("{") || line.equals("}")) continue;

            // ── 1. Primitive local variable declaration ─────────────────────
            {
                Pattern p = Pattern.compile(
                    "^(int|double|float|long|short|byte|char|boolean)\\s+(\\w+)\\s*=\\s*([^;]+);");
                Matcher m = p.matcher(line);
                if (m.find()) {
                    String type = m.group(1), name = m.group(2), val = m.group(3).trim();
                    // Evaluate simple arithmetic in value
                    String display = val;
                    locals.put(name, new Variable(name, type, display, true, null));
                    refreshTopFrame(stack, locals);
                    steps.add(step(stepNum++, ln,
                        "STACK (local): Primitive `" + type + " " + name + " = " + display + "` declared in `" + methodName + "()`. " +
                        "The value `" + display + "` is stored DIRECTLY inside the stack frame — no heap involved.",
                        line, "variable_assign", snapshot(stack, heap, metaspace)));
                    continue;
                }
            }

            // ── 2. Reference variable + object creation: Dog d = new Dog(...) ─
            {
                Pattern p = Pattern.compile(
                    "^(\\w[\\w<>\\[\\]]*?)\\s+(\\w+)\\s*=\\s*new\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*;");
                Matcher m = p.matcher(line);
                if (m.find()) {
                    String refType = m.group(1), refName = m.group(2);
                    String cls     = m.group(3), args    = m.group(4).trim();

                    String addr = nextAddr();
                    Map<String, Variable> fields = buildFields(cls, args, locals, heap);
                    String objType = cls.equals("String") ? "string"
                                   : cls.endsWith("[]")  ? "array" : "instance";
                    heap.put(addr, new HeapObject(addr, cls, fields, objType));

                    // Reference lives on the stack
                    locals.put(refName, new Variable(refName, refType, addr, false, addr));
                    refreshTopFrame(stack, locals);

                    steps.add(step(stepNum++, ln,
                        "HEAP (new object): `new " + cls + "(" + args + ")` allocates an object at address " + addr + " on the HEAP. " +
                        "Reference variable `" + refName + "` is stored on the STACK frame of `" + methodName + "()` and points to " + addr + ".",
                        line, "object_create", snapshot(stack, heap, metaspace)));
                    continue;
                }
            }

            // ── 3. String literal assignment: String s = "hello"; ───────────
            {
                Pattern p = Pattern.compile(
                    "^String\\s+(\\w+)\\s*=\\s*(\"[^\"]*\")\\s*;");
                Matcher m = p.matcher(line);
                if (m.find()) {
                    String name = m.group(1), literal = m.group(2);
                    String addr = nextAddr();
                    heap.put(addr, new HeapObject(addr, "String",
                        Map.of("value", new Variable("value","char[]", stripQuotes(literal), true, null)),
                        "string"));
                    locals.put(name, new Variable(name, "String", addr, false, addr));
                    refreshTopFrame(stack, locals);
                    steps.add(step(stepNum++, ln,
                        "HEAP (String literal): String `" + literal + "` is a String object allocated on the HEAP at " + addr + ". " +
                        "Reference `" + name + "` on the stack points to " + addr + ". Strings are ALWAYS objects in Java.",
                        line, "object_create", snapshot(stack, heap, metaspace)));
                    continue;
                }
            }

            // ── 4. Standalone object creation (no assignment): new Foo(); ───
            {
                Pattern p = Pattern.compile("^new\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*;");
                Matcher m = p.matcher(line);
                if (m.find()) {
                    String cls = m.group(1), args = m.group(2).trim();
                    String addr = nextAddr();
                    heap.put(addr, new HeapObject(addr, cls, buildFields(cls, args, locals, heap), "instance"));
                    steps.add(step(stepNum++, ln,
                        "HEAP (anonymous): `new " + cls + "()` creates an object at " + addr + " on the HEAP. " +
                        "No reference is stored — this object is immediately eligible for GC.",
                        line, "object_create", snapshot(stack, heap, metaspace)));
                    continue;
                }
            }

            // ── 5. Primitive reassignment: x = x + 1; ───────────────────────
            {
                Pattern p = Pattern.compile("^(\\w+)\\s*([+\\-*/%]?=)\\s*([^;]+);");
                Matcher m = p.matcher(line);
                if (m.find()) {
                    String name = m.group(1), rhs = m.group(3).trim();
                    if (locals.containsKey(name)) {
                        Variable old = locals.get(name);
                        if (old.isPrimitive()) {
                            locals.put(name, new Variable(name, old.type(), rhs, true, null));
                            refreshTopFrame(stack, locals);
                            steps.add(step(stepNum++, ln,
                                "STACK (update): Primitive `" + name + "` updated to `" + rhs + "` inside stack frame of `" + methodName + "()`. " +
                                "The new value replaces the old value directly on the stack.",
                                line, "variable_assign", snapshot(stack, heap, metaspace)));
                            continue;
                        }
                    }
                    // Static field update
                    if (liveStatics.containsKey(name)) {
                        Variable old = liveStatics.get(name);
                        liveStatics.put(name, new Variable(name, old.type(), rhs, old.isPrimitive(), old.heapRef()));
                        MetaspaceEntry e = metaspace.get(0);
                        metaspace.set(0, new MetaspaceEntry(e.className(), e.methods(), new LinkedHashMap<>(liveStatics), e.classType()));
                        steps.add(step(stepNum++, ln,
                            "METASPACE (static update): Static field `" + name + "` updated to `" + rhs + "`. " +
                            "Static fields live in Metaspace — they are shared by all instances and persist for the class lifetime.",
                            line, "static_load", snapshot(stack, heap, metaspace)));
                        continue;
                    }
                }
            }

            // ── 6. User-defined method call with frame push/pop ──────────────
            {
                // Match: someMethod(args); or obj.someMethod(args);
                Pattern p = Pattern.compile("^(?:(\\w+)\\.)?(\\w+)\\(([^)]*)\\)\\s*;");
                Matcher m = p.matcher(line);
                if (m.find()) {
                    String obj    = m.group(1);
                    String method = m.group(2);
                    String args   = m.group(3).trim();

                    // Skip System.out, reserved words
                    if ("System".equals(obj) || "out".equals(obj) || "Math".equals(obj)
                            || isControlKeyword(method)) continue;

                    // Is this a user-defined method in the code?
                    if (code.contains(method + "(") && !method.equals(methodName)) {
                        // Push frame
                        Map<String, Variable> callLocals = buildArgLocals(args, locals, method, code);
                        String callFrameId = "frame_" + method + "_" + stepNum;
                        StackFrame callFrame = new StackFrame(callFrameId, method,
                            obj != null ? obj : className, ln, callLocals);
                        stack.push(callFrame);

                        steps.add(step(stepNum++, ln,
                            "METHOD CALL → STACK: `" + method + "(" + args + ")` is called. " +
                            "A NEW stack frame is pushed for `" + method + "()`. " +
                            "Arguments are copied into the new frame's local variable area.",
                            line, "method_call", snapshot(stack, heap, metaspace)));

                        // Walk the called method's body recursively (1 level)
                        Map<String, Variable> calledLocals = new LinkedHashMap<>(callLocals);
                        stepNum = walkMethodBody(lines, code, className, method,
                            stack, heap, metaspace, calledLocals, steps, stepNum, liveStatics);

                        // Pop frame
                        stack.pop();
                        steps.add(step(stepNum++, ln,
                            "METHOD RETURN → STACK: `" + method + "()` returns. " +
                            "Its stack frame is popped; all its locals are gone.",
                            "}", "method_return", snapshot(stack, heap, metaspace)));
                        continue;
                    }
                }
            }

            // ── 7. System.out.println ────────────────────────────────────────
            {
                if (line.contains("System.out.print")) {
                    Pattern p = Pattern.compile("println?\\((.+?)\\)");
                    Matcher m = p.matcher(line);
                    String arg = m.find() ? m.group(1).trim() : "?";
                    steps.add(step(stepNum++, ln,
                        "CONSOLE OUTPUT: `System.out.println(" + arg + ")` executes. " +
                        "This is a method call that does NOT allocate new heap memory for the print itself. " +
                        "Control briefly enters PrintStream's stack frame (not shown for brevity).",
                        line, "method_call", snapshot(stack, heap, metaspace)));
                    continue;
                }
            }

            // ── 8. Return statement ──────────────────────────────────────────
            {
                if (line.startsWith("return ")) {
                    String retVal = line.substring(7).replace(";","").trim();
                    steps.add(step(stepNum++, ln,
                        "RETURN: `" + line + "` — value `" + retVal + "` is placed in the return register and " +
                        "control returns to the caller. The current stack frame will be popped next.",
                        line, "method_return", snapshot(stack, heap, metaspace)));
                }
            }
        }

        return stepNum;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Metaspace builder  (called ONCE at class-load time)
    // ═══════════════════════════════════════════════════════════════════════

    private List<MetaspaceEntry> buildMetaspace(String code, String className) {
        List<MetaspaceEntry> result = new ArrayList<>();

        // --- static fields (uninitialized / default values at load time) ---
        Map<String, Variable> statics = new LinkedHashMap<>();
        Pattern sp = Pattern.compile(
            "(?:public\\s+|private\\s+|protected\\s+)?static\\s+(?:final\\s+)?(\\w+)\\s+(\\w+)(?:\\s*=\\s*([^;]+))?;");
        Matcher sm = sp.matcher(code);
        while (sm.find()) {
            String type = sm.group(1), name = sm.group(2);
            String val  = sm.group(3) != null ? sm.group(3).trim() : defaultValue(type);
            if (!name.equals("main") && !type.equals("void")) {
                statics.put(name, new Variable(name, type, val, isPrimType(type), null));
            }
        }

        // --- method signatures ---
        List<String> methods = new ArrayList<>();
        Pattern mp = Pattern.compile(
            "(?:public\\s+|private\\s+|protected\\s+|static\\s+|final\\s+)+(\\w+)\\s+(\\w+)\\s*\\(([^)]*)\\)");
        Matcher mm = mp.matcher(code);
        while (mm.find()) {
            String ret  = mm.group(1);
            String name = mm.group(2);
            String params = mm.group(3).trim();
            if (!name.equals("class") && !name.equals("interface") && !isControlKeyword(name)) {
                methods.add(ret + " " + name + "(" + params + ")");
            }
        }

        String classType = code.contains("interface ") ? "interface"
                         : code.contains("enum ")      ? "enum" : "class";

        result.add(new MetaspaceEntry(className, methods, statics, classType));

        // Inner / referenced classes that appear as `new XYZ(`
        Set<String> seen = new HashSet<>();
        seen.add(className);
        Pattern np = Pattern.compile("new\\s+(\\w+)\\s*\\(");
        Matcher nm = np.matcher(code);
        while (nm.find()) {
            String cls = nm.group(1);
            if (seen.add(cls) && !cls.equals("String") && !cls.equals("StringBuilder")) {
                List<String> ctors = new ArrayList<>();
                // Try to find the class definition
                Pattern cp = Pattern.compile("class\\s+" + cls + "\\b");
                if (!cp.matcher(code).find()) {
                    ctors.add(cls + "(...)");
                }
                result.add(new MetaspaceEntry(cls, ctors, Map.of(), "class"));
            }
        }

        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    /** Build a HeapObject's field map from constructor argument list */
    private Map<String, Variable> buildFields(String cls, String args,
            Map<String, Variable> locals, Map<String, HeapObject> heap) {
        Map<String, Variable> fields = new LinkedHashMap<>();
        if (args == null || args.isBlank()) return fields;

        String[] parts = args.split(",");
        String[] names = guessFieldNames(cls, parts.length);

        for (int i = 0; i < parts.length; i++) {
            String raw = parts[i].trim();
            String fname = i < names.length ? names[i] : "field" + (i + 1);
            // Resolve variable references
            String val = raw;
            boolean prim = isPrimValue(raw);
            String ref = null;
            if (!prim && locals.containsKey(raw)) {
                Variable v = locals.get(raw);
                val  = v.value();
                prim = v.isPrimitive();
                ref  = v.heapRef();
            }
            fields.put(fname, new Variable(fname, "?", val, prim, ref));
        }
        return fields;
    }

    /** Build locals map for a called method using actual arg values */
    private Map<String, Variable> buildArgLocals(String callArgs, Map<String, Variable> callerLocals,
            String method, String code) {
        Map<String, Variable> locals = new LinkedHashMap<>();
        if (callArgs == null || callArgs.isBlank()) return locals;

        // Try to find param names from method signature
        Pattern sig = Pattern.compile(method + "\\s*\\(([^)]*)\\)");
        Matcher sm  = sig.matcher(code);
        String[] paramNames = null;
        if (sm.find()) {
            String[] rawParams = sm.group(1).split(",");
            paramNames = new String[rawParams.length];
            for (int i = 0; i < rawParams.length; i++) {
                String[] parts = rawParams[i].trim().split("\\s+");
                paramNames[i] = parts.length >= 2 ? parts[parts.length - 1] : ("p" + i);
            }
        }

        String[] args = callArgs.split(",");
        for (int i = 0; i < args.length; i++) {
            String arg   = args[i].trim();
            String pname = (paramNames != null && i < paramNames.length) ? paramNames[i] : ("arg" + i);
            boolean prim = isPrimValue(arg);
            String ref   = null;
            String val   = arg;
            if (callerLocals.containsKey(arg)) {
                Variable v = callerLocals.get(arg);
                val  = v.value(); prim = v.isPrimitive(); ref = v.heapRef();
            }
            locals.put(pname, new Variable(pname, "?", val, prim, ref));
        }
        return locals;
    }

    private void refreshTopFrame(Deque<StackFrame> stack, Map<String, Variable> locals) {
        if (stack.isEmpty()) return;
        StackFrame old = stack.pop();
        stack.push(new StackFrame(old.id(), old.methodName(), old.className(),
            old.lineNumber(), new LinkedHashMap<>(locals)));
    }

    private ExecutionStep step(int num, int line, String desc, String highlight,
            String eventType, MemorySnapshot snap) {
        return new ExecutionStep(num, line, desc, highlight, eventType, snap);
    }

    private MemorySnapshot snapshot(Deque<StackFrame> stack,
            Map<String, HeapObject> heap, List<MetaspaceEntry> meta) {
        return new MemorySnapshot(new ArrayList<>(stack), new LinkedHashMap<>(heap), new ArrayList<>(meta));
    }

    private String extractClassName(String code) {
        Matcher m = Pattern.compile("(?:public\\s+)?class\\s+(\\w+)").matcher(code);
        return m.find() ? m.group(1) : "Main";
    }

    private String extractFirstMethodName(String code) {
        Matcher m = Pattern.compile("(?:public|private|protected)\\s+\\w+\\s+(\\w+)\\s*\\(").matcher(code);
        return m.find() ? m.group(1) : "main";
    }

    private int findMethodLine(List<String> lines, String method) {
        for (int i = 0; i < lines.size(); i++)
            if (lines.get(i).contains(method + "(")) return i + 1;
        return 1;
    }

    private int findReturnLine(List<String> lines, String method) {
        int start = findMethodLine(lines, method);
        for (int i = start; i < lines.size(); i++) {
            String t = lines.get(i).trim();
            if (t.startsWith("return") || t.equals("}")) return i + 1;
        }
        return lines.size();
    }

    private int lineOf(List<String> lines, int charOffset) {
        int pos = 0;
        for (int i = 0; i < lines.size(); i++) {
            pos += lines.get(i).length() + 1;
            if (pos > charOffset) return i + 1;
        }
        return lines.size();
    }

    private boolean isPrimType(String type) {
        return Set.of("int","double","float","long","short","byte","char","boolean").contains(type);
    }

    private boolean isPrimValue(String val) {
        if (val == null) return true;
        return val.matches("-?\\d+(\\.\\d+)?[fFdDlL]?")
            || val.equals("true") || val.equals("false")
            || val.matches("'.'");
    }

    private boolean isStringLiteral(String val) {
        return val.startsWith("\"") && val.endsWith("\"");
    }

    private String stripQuotes(String s) {
        if (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2)
            return s.substring(1, s.length() - 1);
        return s;
    }

    private String defaultValue(String type) {
        return switch (type) {
            case "int","short","byte","long" -> "0";
            case "double","float" -> "0.0";
            case "boolean" -> "false";
            case "char" -> "'\u0000'";
            default -> "null";
        };
    }

    private boolean isControlKeyword(String name) {
        return Set.of("if","else","while","for","switch","case","do","try","catch","finally","return")
                   .contains(name);
    }

    private String[] guessFieldNames(String cls, int count) {
        Map<String, String[]> known = new HashMap<>();
        known.put("Dog",    new String[]{"name","age"});
        known.put("Cat",    new String[]{"name","age"});
        known.put("Person", new String[]{"name","age"});
        known.put("Car",    new String[]{"make","model","year"});
        known.put("Point",  new String[]{"x","y"});
        known.put("Node",   new String[]{"value","next"});
        known.put("Student",new String[]{"name","grade","age"});
        known.put("Animal", new String[]{"name","type"});
        if (known.containsKey(cls)) return known.get(cls);
        String[] r = new String[count];
        for (int i = 0; i < count; i++) r[i] = "field" + (i + 1);
        return r;
    }
}