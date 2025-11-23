-- Carousel slides table aligned with current front-end design (Carousel.tsx)
-- Fields cover image, link target (href), optional titles, ordering and active status

CREATE TABLE IF NOT EXISTS `carousel_slides` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NULL,
  `subtitle` VARCHAR(255) NULL,
  `img` VARCHAR(2048) NOT NULL,         -- image URL or public path
  `href` VARCHAR(2048) NOT NULL,        -- target link when clicking the slide CTA
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0, -- lower first; control display order
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,    -- 1=visible, 0=hidden
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_carousel_is_active` (`is_active`),
  KEY `idx_carousel_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
