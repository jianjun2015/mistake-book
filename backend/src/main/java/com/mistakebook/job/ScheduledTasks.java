package com.mistakebook.job;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 定时任务（Spring Scheduled）
 */
@Slf4j
@Component
public class ScheduledTasks {

    /**
     * 每天凌晨2点执行 - 数据清理
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void dailyCleanup() {
        log.info("[定时任务] 每日数据清理执行");
        // TODO: 清理过期数据、临时文件等
    }

    /**
     * 每小时执行一次 - 健康检查日志
     */
    @Scheduled(fixedRate = 3600000)
    public void healthCheck() {
        log.debug("[定时任务] 健康检查 - 系统运行正常");
    }
}