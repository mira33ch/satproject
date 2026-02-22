pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds() }

  environment {
    DOCKERHUB_CREDS = "dockerhub"
    GITOPS_CREDS    = "github-pat-mira33ch"
    SONAR_SERVER    = "sonar-satmonitor"
    SONAR_SCANNER   = "sonar-scanner"
  }

  stages {
    stage("Checkout") { steps { checkout scm } }

    stage("Docker login test") {
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS, usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
        }
        sh 'docker logout || true'
      }
    }

    stage("Sonar reachability test") {
      steps {
        sh 'curl -I http://satmonitor.local/sonar/ | head -n 5'
        script {
          def scannerHome = tool(env.SONAR_SCANNER)
          sh "${scannerHome}/bin/sonar-scanner -h >/dev/null"
        }
      }
    }

    stage("GitHub PAT test (clone gitops)") {
      steps {
        withCredentials([string(credentialsId: env.GITOPS_CREDS, variable: 'GHPAT')]) {
          sh """
            set -e
            rm -rf /tmp/satmonitor-gitops
            git clone https://$GHPAT@github.com/mira33ch/satmonitor-gitops.git /tmp/satmonitor-gitops
            ls -la /tmp/satmonitor-gitops | head
          """
        }
      }
    }
  }
}
