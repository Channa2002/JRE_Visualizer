package com.channa.jrepro.model;
import java.util.Map;
 
/**
 * Represents a single frame on the call stack.
 */
public record StackFrame(
    String id,
    String methodName,
    String className,
    int lineNumber,
    Map<String, Variable> localVariables
) {}
