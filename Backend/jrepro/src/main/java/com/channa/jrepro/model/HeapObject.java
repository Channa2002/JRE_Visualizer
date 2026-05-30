package com.channa.jrepro.model;

import java.util.Map;
 
/**
 * Represents an object allocated on the heap.
 */
public record HeapObject(
    String id,
    String className,
    Map<String, Variable> fields,
    String objectType  // "instance", "array", "string"
) {}
