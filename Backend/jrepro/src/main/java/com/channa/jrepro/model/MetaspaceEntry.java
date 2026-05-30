package com.channa.jrepro.model;

import java.util.List;
import java.util.Map;
 
/**
 * Represents a class loaded into Metaspace.
 */
public record MetaspaceEntry(
    String className,
    List<String> methods,
    Map<String, Variable> staticFields,
    String classType   // "class", "interface", "enum"
) {}
