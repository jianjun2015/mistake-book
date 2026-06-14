package com.mistakebook.controller;

import com.mistakebook.repository.TagRepository;
import com.mistakebook.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 标签管理控制器
 */
@Tag(name = "标签管理", description = "用户标签管理接口")
@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagRepository tagRepository;

    public TagController(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Operation(summary = "获取用户标签列表")
    @GetMapping
    public Result<List<Map<String, Object>>> getTags(@RequestParam Long userId) {
        List<Map<String, Object>> tags = tagRepository.findByUserIdOrderByCreateTimeDesc(userId)
                .stream().map(tag -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", tag.getId());
                    m.put("name", tag.getName());
                    m.put("color", tag.getColor());
                    return m;
                }).collect(Collectors.toList());
        return Result.success(tags);
    }

    @Operation(summary = "创建标签")
    @PostMapping
    public Result<Map<String, Object>> createTag(
            @RequestParam Long userId,
            @RequestParam String name,
            @RequestParam(defaultValue = "#999999") String color) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", UUID.randomUUID());
        result.put("name", name);
        result.put("color", color);
        return Result.success("标签创建成功", result);
    }
}
