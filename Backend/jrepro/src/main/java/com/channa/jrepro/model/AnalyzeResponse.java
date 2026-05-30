package com.channa.jrepro.model;

import java.util.List;
 
/**
 * Response containing all execution steps for the visualizer.
 */
public record AnalyzeResponse(
    String title,
    String description,
    String originalCode,
    List<ExecutionStep> steps,
    int totalSteps
) {}
