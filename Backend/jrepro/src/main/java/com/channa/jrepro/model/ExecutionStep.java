package com.channa.jrepro.model;

public record ExecutionStep(
    int stepNumber,
    int lineNumber,
    String description,
    String codeHighlight,
    String eventType,   // "method_call", "variable_assign", "object_create", "method_return", "static_load"
    MemorySnapshot memorySnapshot
) {}
