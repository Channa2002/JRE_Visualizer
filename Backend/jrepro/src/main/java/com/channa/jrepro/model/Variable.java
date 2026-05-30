package com.channa.jrepro.model;

public record Variable(
    String name,
    String type,
    String value,
    boolean isPrimitive,
    String heapRef   // null for primitives, heap object id for references
) {}