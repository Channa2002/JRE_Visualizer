package com.channa.jrepro.controller;

import com.channa.jrepro.model.*;
import com.channa.jrepro.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
import java.util.Map;
 
/**
 * Main REST controller for the JRE Visualizer API.
 */
@RestController
@RequestMapping("/api")
public class VisualizerController {
 
    private final JavaAnalyzerService analyzerService;
    private final ExamplesService examplesService;
 
    public VisualizerController(JavaAnalyzerService analyzerService, ExamplesService examplesService) {
        this.analyzerService = analyzerService;
        this.examplesService = examplesService;
    }
 
    /**
     * POST /api/analyze
     * Analyzes Java code and returns step-by-step memory snapshots.
     */
    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeResponse> analyze(@RequestBody AnalyzeRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
 
        // If an example ID is provided, use its code instead
        String code = request.code();
        if (request.exampleId() != null) {
            var example = examplesService.findById(request.exampleId());
            if (example.isPresent()) {
                code = example.get().code();
            }
        }
 
        AnalyzeResponse response = analyzerService.analyze(code);
        return ResponseEntity.ok(response);
    }
 
    /**
     * GET /api/examples
     * Returns all available preset Java examples.
     */
    @GetMapping("/examples")
    public ResponseEntity<List<ExamplesService.PresetExample>> getExamples() {
        return ResponseEntity.ok(examplesService.getAll());
    }
 
    /**
     * GET /api/examples/{id}
     * Returns a single preset example by id.
     */
    @GetMapping("/examples/{id}")
    public ResponseEntity<?> getExample(@PathVariable String id) {
        return examplesService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
 
    /**
     * GET /api/health
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "jre-visualizer"
        ));
    }
}