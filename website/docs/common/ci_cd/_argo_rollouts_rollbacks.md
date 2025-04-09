## Argo CD - Rollbacks

During a rollout, you can revert to a previous version using the `argo-rollouts` CLI. To undo the latest rollout and revert to the previous stable version, run:

```shell-session
student@cc-lab:~$ argo-rollouts abort go-simple-webserver
```

If the previous rollout is complete, we need to `undo` to a previous version:

```shell-session
student@cc-lab:~$ argo-rollouts undo go-simple-webserver
```

To check the state of the rollout, you can use the `argo-rollouts get` command:

```shell-session
student@cc-lab:~$ argo-rollouts get rollout go-simple-webserver
```

You can also view the rollout history and revert to a specific revision:

```shell-session
student@cc-lab:~$ argo-rollouts get rollout go-simple-webserver
Name:            go-simple-webserver
Namespace:       default
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          1/3
  SetWeight:     50
  ActualWeight:  50
Images:          ghcr.io/andreia-oca/go-simple-webserver:latest (canary)
                 ghcr.io/andreia-oca/go-simple-webserver@sha256:db9b124351be3aebf40faaffb5fa7ad4843c06752e11db7cae07447bb708b976 (stable)
Replicas:
  Desired:       10
  Current:       10
  Updated:       5
  Ready:         10
  Available:     10

NAME                                             KIND        STATUS     AGE    INFO
⟳ go-simple-webserver                            Rollout     ॥ Paused   5m15s
├──# revision:4

└──# revision:3
```

To revert to a specific revision, use the `--to-revision` flag with the desired revision number:
```shell-session
student@cc-lab:~$ argo-rollouts undo go-simple-webserver --to-revision=X
```

### Exercise - revert to the latest stable version

Push a faulty commit to your repository (e.g. change the docker image to something nonexistent or set `container.resources.limits` to be less the `container.resources.requests`).

Check if the deployment is healthy or not:

```shell-session
student@cc-lab:~ kubectl get rollout go-simple-webserver -n default
student@cc-lab:~ kubectl get deployment go-simple-webserver -n default
```

If it's not healthy, rollback to the previous stable version with `argocd undo`.

Monitor the deployment's status again:

```shell-session
student@cc-lab:~ kubectl get rollout go-simple-webserver -n default
```
