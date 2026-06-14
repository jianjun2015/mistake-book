package com.mistakebook.controller;

import com.mistakebook.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "测试接口", description = "用于测试的接口")
@RestController
public class TestController {

    @Operation(summary = "测试接口 - 输出系统信息")
    @GetMapping("/api/test/system-info")
    public Result<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("osName", System.getProperty("os.name"));
        info.put("osArch", System.getProperty("os.arch"));
        info.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        info.put("maxMemory", Runtime.getRuntime().maxMemory() / 1024 / 1024 + " MB");
        info.put("freeMemory", Runtime.getRuntime().freeMemory() / 1024 / 1024 + " MB");
        return Result.success("系统信息获取成功", info);
    }
}
