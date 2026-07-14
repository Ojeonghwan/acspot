pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    DEPLOY_HOST = '13.125.234.71'
    DEPLOY_USER = 'ubuntu'
    DEPLOY_PATH = '/opt/acspot'
    DEPLOY_BRANCH = 'main'
    DEPLOY_MODE = 'local'
    SSH_CREDENTIALS_ID = 'acspot-deploy-key'
  }

  triggers {
    githubPush()
    pollSCM('H/2 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Validate Docker Builds') {
      parallel {
        stage('Frontend Build') {
          steps {
            sh 'docker build -t acspot-frontend-ci ./frontend'
          }
        }

        stage('Backend Build') {
          steps {
            sh 'docker build -t acspot-backend-ci ./backend'
          }
        }
      }
    }

    stage('Deploy') {
      when {
        expression { env.BRANCH_NAME == null || env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main' }
      }
      steps {
        script {
          if (env.DEPLOY_MODE == 'local') {
            sh """
              set -e
              git config --global --add safe.directory ${DEPLOY_PATH}
              cd ${DEPLOY_PATH}
              git fetch origin ${DEPLOY_BRANCH}
              git reset --hard origin/${DEPLOY_BRANCH}
              test -f frontend/.env.local
              docker compose -f docker-compose.deploy.yml up --build -d
              docker compose -f docker-compose.deploy.yml ps
            """
          } else {
            sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
              sh """
                ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                  set -e
                  git config --global --add safe.directory ${DEPLOY_PATH}
                  cd ${DEPLOY_PATH}
                  git fetch origin ${DEPLOY_BRANCH}
                  git reset --hard origin/${DEPLOY_BRANCH}
                  test -f frontend/.env.local
                  docker compose -f docker-compose.deploy.yml up --build -d
                  docker compose -f docker-compose.deploy.yml ps
                '
              """
            }
          }
        }
      }
    }

    stage('Health Check') {
      when {
        expression { env.BRANCH_NAME == null || env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main' }
      }
      steps {
        sh "curl -fsS http://${DEPLOY_HOST}/"
        sh "curl -fsS http://${DEPLOY_HOST}/api/places/nearby?lat=48.8566\\&lng=2.3522\\&radius=3000"
      }
    }
  }

  post {
    success {
      echo "ACSpot deployment completed."
    }
    failure {
      echo "ACSpot pipeline failed. Check the Jenkins console log."
    }
  }
}
