CREATE TABLE `api_keys` (
	`key` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `secrets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`encrypted_content` text,
	`file_key` text,
	`file_name` text,
	`file_size` integer,
	`file_type` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`burn_on_read` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`password_hash` text,
	`allowed_ip` text,
	`is_e2ee` integer DEFAULT false NOT NULL,
	`read_at` integer,
	`read_by_ip` text,
	`read_location` text,
	`recipient_id` text,
	`drop_key` text,
	`alias` text
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subdomain` text NOT NULL,
	`display_name` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_subdomain_unique` ON `user_profiles` (`subdomain`);