-- ============================================
-- 匿名订阅功能表结构重构
-- 支持坐标和邮编互为备选
-- Tag分类：age, eventtype
-- ============================================

-- 步骤1: 备份旧表数据（如果存在）
CREATE TABLE IF NOT EXISTS `anonymous_subscriptions_backup` 
LIKE `anonymous_subscriptions`;

INSERT INTO `anonymous_subscriptions_backup` 
SELECT * FROM `anonymous_subscriptions`;

-- 步骤2: 删除旧表
DROP TABLE IF EXISTS `anonymous_subscriptions`;

-- 步骤3: 创建新表 - 用户档案
CREATE TABLE `anonymous_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备唯一标识',
  `latitude` decimal(10, 7) NULL COMMENT '纬度，与邮编互为备选',
  `longitude` decimal(10, 7) NULL COMMENT '经度，与邮编互为备选',
  `zip_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '邮编，与坐标互为备选',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ukey_device_token`(`device_token` ASC) USING BTREE,
  INDEX `idx_location`(`latitude` ASC, `longitude` ASC) USING BTREE,
  INDEX `idx_zip`(`zip_code` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic COMMENT = '匿名用户档案';

-- 步骤4: 创建新表 - 用户标签
CREATE TABLE `anonymous_profile_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int NOT NULL COMMENT '关联anonymous_profiles.id',
  `tag_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签名称',
  `tag_category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签分类: age, eventtype',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `ukey_profile_tag`(`profile_id` ASC, `tag_name` ASC) USING BTREE,
  INDEX `idx_tag`(`tag_name` ASC) USING BTREE,
  INDEX `idx_category`(`tag_category` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic COMMENT = '匿名用户标签';

-- 步骤5: 数据迁移（如果旧表有数据，需要根据实际业务逻辑迁移）
-- 注意：旧表只有device_token和tag_name，缺少tag_category和位置信息
-- 需要根据业务规则手动补充tag_category
-- 示例迁移逻辑（需要根据实际情况调整）：
/*
INSERT INTO `anonymous_profiles` (device_token, created_at)
SELECT DISTINCT device_token, created_at 
FROM `anonymous_subscriptions_backup`;

INSERT INTO `anonymous_profile_tags` (profile_id, tag_name, tag_category, created_at)
SELECT 
    p.id,
    s.tag_name,
    CASE 
        WHEN s.tag_name IN ('kid', 'teens', 'adult') THEN 'age'
        ELSE 'eventtype'
    END as tag_category,
    s.created_at
FROM `anonymous_subscriptions_backup` s
JOIN `anonymous_profiles` p ON s.device_token = p.device_token;
*/

-- 步骤6: 验证表结构
SELECT 'anonymous_profiles' as table_name, COUNT(*) as record_count FROM `anonymous_profiles`
UNION ALL
SELECT 'anonymous_profile_tags' as table_name, COUNT(*) as record_count FROM `anonymous_profile_tags`;
