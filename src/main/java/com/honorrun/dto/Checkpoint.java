package com.honorrun.dto;

public record Checkpoint(
        String id,
        String name,
        double lat,
        double lng,
        String story,
        String historyNote,
        String imagePastUrl,
        String imagePresentUrl
) {}
