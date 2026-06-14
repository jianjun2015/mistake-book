package com.mistakebook.interceptor;

import com.mistakebook.service.UserService;
import com.mistakebook.util.JwtUtil;
import com.mistakebook.util.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * JWT 认证拦截器
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS 请求直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String token = extractToken(request);
        if (token == null || !jwtUtil.validateToken(token)) {
            sendError(response, 401, "未登录或Token已过期");
            return false;
        }

        // 从 Token 中获取用户ID
        Long userId = jwtUtil.getUserIdFromToken(token);

        // 验证 Token 是否在 Redis 中存在（未被退出登录）
        if (!userService.isTokenValid(userId, token)) {
            sendError(response, 401, "Token已失效，请重新登录");
            return false;
        }

        // 将用户ID存入上下文
        UserContext.setCurrentUserId(userId);

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // 请求结束后清理上下文
        UserContext.clear();
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void sendError(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":" + status + ",\"message\":\"" + message + "\",\"timestamp\":\"" + java.time.Instant.now() + "\"}");
    }
}
