package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Server   ServerConfig
	Redis    RedisConfig
	Database DatabaseConfig
	Worker   WorkerConfig
	LLM      LLMConfig
}

type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

type RedisConfig struct {
	Host         string
	Port         string
	PoolSize     int
	MinIdleConns int
}

type DatabaseConfig struct {
	Host         string
	Port         string
	Name         string
	User         string
	Password     string
	MaxOpenConns int
	MaxIdleConns int
}

type WorkerConfig struct {
	NumWorkers int
	MaxRetries int
	JobTimeout time.Duration
}

type LLMConfig struct {
	Provider  string
	APIKey    string
	Model     string
	MaxTokens int
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnv("SERVER_PORT", "8080"),
			ReadTimeout:  30 * time.Second,
			WriteTimeout: 30 * time.Second,
		},
		Redis: RedisConfig{
			Host:         getEnv("REDIS_HOST", "localhost"),
			Port:         getEnv("REDIS_PORT", "6379"),
			PoolSize:     getEnvInt("REDIS_POOL_SIZE", 100),
			MinIdleConns: getEnvInt("REDIS_MIN_IDLE_CONNS", 10),
		},
		Database: DatabaseConfig{
			Host:         getEnv("DB_HOST", "localhost"),
			Port:         getEnv("DB_PORT", "5432"),
			Name:         getEnv("DB_NAME", "workflow_db"),
			User:         getEnv("DB_USER", "postgres"),
			Password:     getEnv("DB_PASSWORD", "postgres"),
			MaxOpenConns: getEnvInt("DB_MAX_OPEN_CONNS", 50),
			MaxIdleConns: getEnvInt("DB_MAX_IDLE_CONNS", 25),
		},
		Worker: WorkerConfig{
			NumWorkers: getEnvInt("WORKER_POOL_SIZE", 10),
			MaxRetries: getEnvInt("WORKER_MAX_RETRIES", 3),
			JobTimeout: 5 * time.Minute,
		},
		LLM: LLMConfig{
			Provider:  getEnv("LLM_PROVIDER", "openai"),
			APIKey:    getEnv("LLM_API_KEY", ""),
			Model:     getEnv("LLM_MODEL", "gpt-4"),
			MaxTokens: getEnvInt("LLM_MAX_TOKENS", 4000),
		},
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}
