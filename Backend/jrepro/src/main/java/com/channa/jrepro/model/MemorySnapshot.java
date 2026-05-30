package com.channa.jrepro.model;

import java.util.List;
import java.util.Map;
 
/**
 * A complete snapshot of JVM memory at a specific execution point.
 */
public record MemorySnapshot(
    List<StackFrame> callStack,
    Map<String, HeapObject> heap,
    List<MetaspaceEntry> metaspace
) {}
