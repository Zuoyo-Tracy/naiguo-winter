CREATE TABLE `race_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `race_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_name` text NOT NULL,
	`from_station` integer NOT NULL,
	`to_station` integer NOT NULL,
	`route_distance` integer NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`elapsed_ms` integer,
	`distance` integer,
	`hits` integer,
	`status` text DEFAULT 'running' NOT NULL,
	FOREIGN KEY (`user_name`) REFERENCES `race_users`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `race_runs_history` ON `race_runs` (`user_name`,`finished_at`);--> statement-breakpoint
CREATE INDEX `race_runs_leaderboard` ON `race_runs` (`from_station`,`to_station`,`status`,`elapsed_ms`);--> statement-breakpoint
CREATE TABLE `race_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_name` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_name`) REFERENCES `race_users`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `race_sessions_expiry` ON `race_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `race_users` (
	`name` text PRIMARY KEY NOT NULL,
	`salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
