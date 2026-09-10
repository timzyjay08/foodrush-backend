pipeline {
    agent any

    tools {
        jdk 'Java 21'
        nodejs 'Node 22'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh 'mvn test -B'
                }
            }
        }

        stage('Frontend Checks') {
            steps {
                dir('frontend') {
                    sh 'npm ci --no-audit --no-fund'
                    sh 'npm run lint'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Backend Image') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                sh 'docker build -t foodrush-backend:${BUILD_NUMBER} backend'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
            archiveArtifacts allowEmptyArchive: true, artifacts: 'frontend/.output/**,backend/target/*.jar', fingerprint: true
        }
    }
}