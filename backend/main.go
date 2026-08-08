package main

import (
	"log"
	"os"
	"os/exec"
	"os/signal"
	"sync"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	// Tải biến môi trường từ file .env (nếu có)
	if err := godotenv.Load(); err != nil {
		log.Println("[Orchestrator] No .env file found or error loading it. Using system environment variables.")
	}

	services := []string{
		"auth-service",
		"application-service",
		"document-service",
		"university-service",
		"ai-agent-service",
	}

	var wg sync.WaitGroup
	var cmds []*exec.Cmd

	// Xử lý tín hiệu tắt (Ctrl+C)
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("\n[Orchestrator] Shutting down all services...")
		for _, cmd := range cmds {
			if cmd.Process != nil {
				cmd.Process.Kill()
			}
		}
		os.Exit(0)
	}()

	log.Println("[Orchestrator] Starting all Microservices in background...")
	for _, svc := range services {
		wg.Add(1)
		cmd := exec.Command("go", "run", ".")
		cmd.Dir = svc
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmds = append(cmds, cmd)

		go func(service string, c *exec.Cmd) {
			defer wg.Done()
			log.Printf("[Orchestrator] Service [%s] started.\n", service)
			if err := c.Run(); err != nil {
				log.Printf("[Orchestrator] Service [%s] exited with error: %v\n", service, err)
			}
		}(svc, cmd)
	}

	// Đợi 3 giây cho các dịch vụ khởi động xong rồi mới bật Gateway
	log.Println("[Orchestrator] Waiting 3 seconds for services to initialize before starting API Gateway...")
	
	wg.Add(1)
	gatewayCmd := exec.Command("go", "run", ".")
	gatewayCmd.Dir = "api-gateway"
	gatewayCmd.Stdout = os.Stdout
	gatewayCmd.Stderr = os.Stderr
	cmds = append(cmds, gatewayCmd)

	go func() {
		defer wg.Done()
		log.Println("[Orchestrator] API Gateway started.")
		if err := gatewayCmd.Run(); err != nil {
			log.Printf("[Orchestrator] API Gateway exited with error: %v\n", err)
		}
	}()

	log.Println("[Orchestrator] All services are running! Press Ctrl+C to stop.")
	wg.Wait()
}
