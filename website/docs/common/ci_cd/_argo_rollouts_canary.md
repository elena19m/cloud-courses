## Argo Rollouts - Canary deployments

Argo Rollouts is a Kubernetes controller and set of CRDs (Custom Resource Definitions) that provide advanced deployment capabilities for Kubernetes applications. It allows you to perform canary deployments, blue/green deployments, and more.

:::info
`argo-rollouts` is already installed in on your VM by the `lab_ci_cd.sh` setup script.
:::

### Creating resources for Argo Rollouts in K8s

To enable and create the resources required by Argo Rollouts in your Kubernetes cluster, run the following commands:

```shell-session
student@cc-lab:~$ kubectl create namespace argo-rollouts
student@cc-lab:~$ kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
student@cc-lab:~$ kubectl get all -n argo-rollouts
NAME                                READY   STATUS    RESTARTS   AGE
pod/argo-rollouts-974ccd9c9-zckrj   1/1     Running   0          25h

NAME                            TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
service/argo-rollouts-metrics   ClusterIP   10.96.123.75   <none>        8090/TCP   25h

NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/argo-rollouts   1/1     1            1           25h

NAME                                      DESIRED   CURRENT   READY   AGE
replicaset.apps/argo-rollouts-974ccd9c9   1         1         1       25h
```

### Creating a canary rollout

This manifest defines a Rollout resource to deploy the `go-simple-webserver` using a canary strategy, gradually shifting traffic from 50% to 100% with a 60-second pause in between. This enables safer deployments by allowing observation and rollback between rollout steps.

```shell-session
student@cc-lab:~/ci_cd_lab$ cat manifests/rollout.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: go-simple-webserver
  labels:
    app: go-simple-webserver
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 50
        - pause: { duration: 60s }
        - setWeight: 100
  selector:
    matchLabels:
      app: go-simple-webserver
  template:
    metadata:
      labels:
        app: go-simple-webserver
    spec:
      containers:
        - name: webserver
          image: ghcr.io/<todo-add-your-github-username>/ci_cd_lab:latest
          ports:
            - containerPort: 8080
          imagePullPolicy: Always
```

Push the `manifests/rollout.yaml` in your repository and monitor how Argo will rollout the application.

```shell-session
student@cc-lab:~/ci_cd_lab$ git add manifests/rollout.yaml
student@cc-lab:~/ci_cd_lab$ git commit -m "add rollout.yaml"
student@cc-lab:~/ci_cd_lab$ git push
```

Watch the rollout process in the terminal:
```shell-session
student@cc-lab:~$ argo-rollouts get rollout go-simple-webserver -n default --watch
```

To see the canary rollout in action, force a new deployment by changing the image tag in the `rollout.yaml` file.

You can use an old image from GHCR (e.g. `ghcr.io/<your-github-username>/go-simple-webserver@sha256:<hash>`) and push the changes to your repository.

To see the sha256 hash, go back to the `Packages` page in GitHub, go to the `ci_cd_lab` package, and you should see the hash by clicking the "three dots button" near the `Digest` label.

You should be able to see the rollout process (the old image is marked as `stable` and the new one as `canary`) in Argo.

```shell-session
student@ccc-lab:~/ci_cd_lab$ argo-rollouts get rollout go-simple-webserver
Name:            go-simple-webserver
Namespace:       default
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          1/3
  SetWeight:     50
  ActualWeight:  50
Images:          ghcr.io/andreia-oca/ci_cd_lab:latest (canary)
                 ghcr.io/andreia-oca/ci_cd_lab@sha256:db9b124351be3aebf40faaffb5fa7ad4843c06752e11db7cae07447bb708b976 (stable)
Replicas:
  Desired:       10
  Current:       10
  Updated:       5
  Ready:         10
  Available:     10

NAME                                             KIND        STATUS     AGE    INFO
⟳ go-simple-webserver                            Rollout     ॥ Paused   5m15s
├──# revision:4
│  └──⧉ go-simple-webserver-7774779488           ReplicaSet  ✔ Healthy  3m59s  canary
│     ├──□ go-simple-webserver-7774779488-9p52t  Pod         ✔ Running  2m29s  ready:1/1
│     ├──□ go-simple-webserver-7774779488-bnngh  Pod         ✔ Running  2m29s  ready:1/1
│     ├──□ go-simple-webserver-7774779488-lvfv4  Pod         ✔ Running  2m29s  ready:1/1
│     ├──□ go-simple-webserver-7774779488-rfcvn  Pod         ✔ Running  2m29s  ready:1/1
│     └──□ go-simple-webserver-7774779488-vfmg9  Pod         ✔ Running  2m29s  ready:1/1
└──# revision:3
   └──⧉ go-simple-webserver-cb659967             ReplicaSet  ✔ Healthy  5m15s  stable
      ├──□ go-simple-webserver-cb659967-htmh7    Pod         ✔ Running  5m15s  ready:1/1
      ├──□ go-simple-webserver-cb659967-tq6xs    Pod         ✔ Running  5m15s  ready:1/1
      ├──□ go-simple-webserver-cb659967-5kskl    Pod         ✔ Running  4m21s  ready:1/1
      ├──□ go-simple-webserver-cb659967-pzhhq    Pod         ✔ Running  4m21s  ready:1/1
      └──□ go-simple-webserver-cb659967-q4rxb    Pod         ✔ Running  4m21s  ready:1/1
```

### Exercise - change the canary to 3 steps

Modify the rollout strategy to include 3 canary steps: shift traffic to 25%, then 75%, and finally 100%, with a 120-seconds pause between each step.

:::info
Don't forget to also change the Docker image tag to force a new rollout.

For example, you can change it back to `latest`.
:::
