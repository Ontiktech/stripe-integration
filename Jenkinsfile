pipeline {
    agent any
    tools {
        nodejs 'Node.js 22.4.1'
    }
    stages {
        stage('Build') {
            steps {
                sh 'npm install'
            }
        }
        stage('Dockerize') {
            steps {
                sh 'docker build -t test-app .'
            }
        }
        stage('Deploy to Docker') {
            steps {
                sh 'docker run -d -p 3000:3000 --name test-app test-app:latest'
            }
        }
    }
}