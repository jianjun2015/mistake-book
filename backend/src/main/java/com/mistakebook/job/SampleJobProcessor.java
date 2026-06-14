package com.mistakebook.job;

import lombok.extern.slf4j.Slf4j;
import tech.powerjob.worker.core.processor.sdk.BasicProcessor;
import tech.powerjob.worker.core.processor.ProcessResult;
import tech.powerjob.worker.core.processor.TaskContext;
import org.springframework.stereotype.Component;

/**
 * 示例 PowerJob 任务处理器
 */
@Slf4j
@Component
public class SampleJobProcessor implements BasicProcessor {

    @Override
    public ProcessResult process(TaskContext taskContext) throws Exception {
        log.info("PowerJob 任务执行: {}", taskContext.getJobParams());
        // 这里可以执行定时任务逻辑
        return new ProcessResult(true, "任务执行成功");
    }
}
