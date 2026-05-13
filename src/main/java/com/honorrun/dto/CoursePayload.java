package com.honorrun.dto;

import java.util.List;

public record CoursePayload(
        String courseId,
        String courseName,
        List<MapPoint> route,
        List<Checkpoint> checkpoints
) {}
