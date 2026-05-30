package com.channa.jrepro.model; 
/**
 * Request payload for code analysis.
 */
public record AnalyzeRequest(
    String code,
    String exampleId   // optional, if using a preset
) {}