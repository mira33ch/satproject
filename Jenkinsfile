pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds() }

  environment {
    DOCKERHUB_CREDS = "dockerhub"
    GITOPS_CREDS    = "github-pat-mira33ch"

    DOCKER_ORG      = "mariem360"
    GITOPS_REPO     = "https://github.com/mira33ch/satmonitor-gitops.git"
    GITOPS_BRANCH   = "main"
    DEV_OVERLAY_PATH = "apps/dev/satmonitor"

    SONAR_SERVER    = "sonar-satmonitor"
    SONAR_SCANNER   = "sonar-scanner"
  }

  stages {
    stage("Checkout") {
      steps {
        checkout scm
        script {
          env.GIT_SHA = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        }
        echo "Commit SHA: ${env.GIT_SHA}"
      }
    }

    stage("Docker login") {
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS, usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
        }
      }
    }

    stage("Build/Test/Sonar/Docker (services)") {
      steps {
        script {
          def services = [
            [name: "satmonitor-discovery",      path: "satmonitor-discovery"],
            [name: "satmonitor-backend-login",  path: "satmonitor-backend-login"],
            [name: "satmonitor-gateway",        path: "satmonitor-gateway"],
            [name: "satmonitor-frontend",       path: "satmonitor-frontend"]
          ]

          for (svc in services) {
            def svcName = svc.name
            def svcPath = svc.path
            def image   = "${env.DOCKER_ORG}/${svcName}"
            def tag     = env.GIT_SHA

            stage("Test: ${svcName}") {
              dir(svcPath) {
                sh '''
                  set -e
                  if [ -f "pom.xml" ]; then
                    mvn -q test
                  elif [ -f "package.json" ]; then
                    npm ci
                    npm test --if-present
                    npm run build --if-present
                  else
                    echo "No pom.xml or package.json; skipping tests."
                  fi
                '''
              }
            }

            stage("Sonar: ${svcName}") {
              dir(svcPath) {
                withSonarQubeEnv(env.SONAR_SERVER) {
                  def scannerHome = tool(env.SONAR_SCANNER)
                  sh """
                    set -e
                    ${scannerHome}/bin/sonar-scanner \
                      -Dsonar.projectKey=${svcName} \
                      -Dsonar.projectName=${svcName} \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=$SONAR_HOST_URL \
                      -Dsonar.login=$SONAR_AUTH_TOKEN
                  """
                }
              }
            }

            stage("Docker build/push: ${svcName}") {
              dir(svcPath) {
                // Frontend: auto-detect angular output folder to pass to Dockerfile ARG
                if (svcName == "satmonitor-frontend" && fileExists("angular.json")) {
                  sh """
                    set -e
                    OUT=\$(python3 - << 'PY'
import json
j=json.load(open('angular.json'))
# take first project
proj=list(j.get('projects',{}).keys())[0]
out=j['projects'][proj]['architect']['build']['options']['outputPath']
# outputPath like "dist/satmonitor-frontend"
print(out.split('/')[-1])
PY
)
                    echo "Detected Angular dist folder: \$OUT"
                    docker build --build-arg PROJECT_NAME="\$OUT" -t ${image}:${tag} .
                    docker push ${image}:${tag}
                  """
                } else {
                  sh """
                    set -e
                    docker build -t ${image}:${tag} .
                    docker push ${image}:${tag}
                  """
                }
              }
            }
          }
        }
      }
    }

    stage("Update GitOps (dev tags)") {
      steps {
        withCredentials([string(credentialsId: env.GITOPS_CREDS, variable: 'GHPAT')]) {
          sh """
            set -e
            rm -rf /tmp/satmonitor-gitops
            git clone https://$GHPAT@github.com/mira33ch/satmonitor-gitops.git /tmp/satmonitor-gitops
            cd /tmp/satmonitor-gitops
            git checkout ${GITOPS_BRANCH}

            python3 - << 'PY'
import pathlib, re
k = pathlib.Path("${DEV_OVERLAY_PATH}/kustomization.yaml")
txt = k.read_text()
sha = "${GIT_SHA}"

def bump(image_name):
    global txt
    pat = rf"(name:\\s*{re.escape('mariem360/' + image_name)}\\s*\\n\\s*newTag:)\\s*.*"
    txt, n = re.subn(pat, rf"\\1 {sha}", txt)
    if n != 1:
        raise SystemExit(f"Expected 1 replacement for {image_name}, got {n}")

for img in ["satmonitor-discovery","satmonitor-backend-login","satmonitor-gateway","satmonitor-frontend"]:
    bump(img)

k.write_text(txt)
print("Updated dev image tags to", sha)
PY

            git add ${DEV_OVERLAY_PATH}/kustomization.yaml
            git commit -m "gitops(dev): bump images to ${GIT_SHA}" || echo "No changes"
            git push origin ${GITOPS_BRANCH}
          """
        }
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
  }
}
