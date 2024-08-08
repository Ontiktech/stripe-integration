pipeline {
    agent any
    tools {
        nodejs 'NodeJS 20.16.0'
    }
    stages {
        stage('Build') {
            steps {
                sh 'chmod 777 .'
                sh 'npm install'
            }
        }
        stage('Copy .env') {
            steps {
                sh 'rm -rf data'
                sh 'rm -rf .env'
                sh 'mkdir data'
                sh 'cp .env.example .env'
            }
        }
        stage('Remove Old Container') {
            steps {
                sh 'docker stop $(docker ps -a -q)'
                sh 'docker rm $(docker ps -a -q)'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'npm run test'
            }
        }
        stage('Dockerize') {
            steps {
                sh 'docker build -t stripe-app .'
            }
        }
        stage('Deploy to Docker') {
            steps {
                sh 'docker run -d -p 5000:5000 --name stripe-app stripe-app:latest'
            }
        }
    }
}
