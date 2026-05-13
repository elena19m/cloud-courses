## Argo Workflows

### What is Argo Workflows?

**Argo Workflows** is a cloud-native workflow engine for Kubernetes that orchestrates parallel jobs. It's designed for compute-intensive workflows where each step is performed by a container.

Key features:
- **Native Kubernetes CRDs**: Workflows are defined as Custom Resource Definitions
- **DAG-based workflows**: Define complex dependencies between tasks
- **Container-native**: Each step runs in its own container
- **Artifact management**: Pass files and data between workflow steps
- **Parameter passing**: Share variables between workflow steps
- **Parallel execution**: Run multiple tasks simultaneously
- **Web UI**: Visualize workflow execution in real-time
- **Scalable**: Leverages Kubernetes for scheduling and resource management

### Why Use Argo Workflows?

Kubernetes Jobs are great for simple batch workloads, but they have limitations:

| Feature | Kubernetes Jobs | Argo Workflows |
|---------|----------------|----------------|
| **Multi-step workflows** | Manual orchestration | Built-in DAG support |
| **Dependencies** | No native support | Declare dependencies easily |
| **Parameter passing** | Manual (ConfigMaps/Secrets) | Native input/output parameters |
| **File passing** | Manual (volumes) | Native artifact management |
| **Parallel execution** | Limited | Advanced parallelism patterns |
| **Conditional logic** | Not supported | Conditionals, loops, recursion |
| **Visualization** | Basic kubectl output | Rich web UI |
| **Retry logic** | Job-level only | Step-level with custom strategies |

**Use Argo Workflows when you need:**
- Multi-step data pipelines
- Complex dependencies between tasks
- Passing data (files, parameters) between steps
- Parallel processing with aggregation
- Machine learning pipelines
- CI/CD workflows
- Data science workflows (ETL, training, inference)

### Installation

#### Install Argo Workflows Server

Create the Argo namespace and install the server components:

```shell-session
$ kubectl create namespace argo
namespace/argo created

$ kubectl apply -n argo -f https://github.com/argoproj/argo-workflows/releases/download/v3.7.14/install.yaml
customresourcedefinition.apiextensions.k8s.io/clusterworkflowtemplates.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/cronworkflows.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/workfloweventbindings.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/workflows.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/workflowtaskresults.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/workflowtasksets.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/workflowtemplates.argoproj.io created
serviceaccount/argo created
serviceaccount/argo-server created
role.rbac.authorization.k8s.io/argo-role created
...
deployment.apps/workflow-controller created
deployment.apps/argo-server created
```

Verify the installation:

```shell-session
$ kubectl get pods -n argo
NAME                                   READY   STATUS    RESTARTS   AGE
argo-server-65f9588cf6-jgtj7           1/1     Running   0          51s
workflow-controller-7df5f5d5c8-vrk85   1/1     Running   0          51s
```

Both pods should be in `Running` status.

#### Install Argo CLI

The Argo CLI makes it easier to submit and manage workflows:

```shell-session
$ curl -sLO "https://github.com/argoproj/argo-workflows/releases/download/v3.7.14/argo-linux-amd64.gz"
$ gunzip argo-linux-amd64.gz
$ chmod +x argo-linux-amd64
$ sudo mv argo-linux-amd64 /usr/local/bin/argo

$ argo version
argo: v3.7.14
```

:::info
Argo Workflows provides a dashboard to interact with the workflows on `localhost:2746`.

There are two options for connecting to the Argo user interface: **SSH tunneling** or **Chrome Remote Desktop**.
:::

:::info
**Option 1: SSH tunneling**

[Follow this tutorial](https://cloud-courses.upb.ro/docs/basic/working_with_openstack/#permanent-ssh-configurations) to configure the SSH service to bind and forward the `2746` port to your machine:

```shell-session
ssh -J fep -L 2746:127.0.0.1:2746 -i ~/.ssh/id_fep  student@10.9.X.Y
```
:::

:::info
**Option 2: Chrome Remote Desktop**

An alternative to SSH tunneling or X11 forwarding is Chrome Remote Desktop, which allows you to connect to the graphical interface of your VM.

If you want to use this method, follow the steps from [here](https://cloud-courses.upb.ro/docs/basic/crd).
:::

:::tip
Start a kubectl port-forward on the VM:
```shell-session
$ kubectl -n argo port-forward deployment/argo-server 2746:2746
Forwarding from 127.0.0.1:2746 -> 2746
```
:::

Open your browser to `https://localhost:2746` (accept the self-signed certificate warning).

To authenticate to the webserver you must run the following commands and paste the resulting token on the login screen.
```shell-session
$ kubectl -n argo create sa argo-admin
$ kubectl -n argo create clusterrolebinding argo-admin \
  --clusterrole=cluster-admin \
    --serviceaccount=argo:argo-admin
$ kubectl -n argo create token argo-admin
```

:::warning
Add the prefix `Bearer <token>` to the token when pasting it in the login screen.
:::

The Argo UI is extremely useful for:
- Visualizing workflow DAGs
- Monitoring workflow execution in real-time
- Viewing logs from each step
- Debugging failed workflows
- Downloading artifacts

### Argo Workflow Concepts

An Argo `Workflow` is a Kubernetes resource that defines a sequence of steps to execute.

It uses `templates` as a reusable component that defines what to execute. Templates can be:
- **Container template**: Runs a container
- **Script template**: Runs a script in a container
- **Steps template**: Defines a sequence of sub-templates
- **DAG template**: Defines tasks with dependencies

A workflow receives **input parameters** that allow you to pass values into templates. **Output parameters** allow you to pass values out of templates and next steps in a workflows

Instead of using parametes for output handling, you can use **artifacts**, which are files that are passed between workflow steps. Argo manages uploading and downloading artifacts automatically.

### Working Examples

Let's explore working examples that demonstrate Argo Workflows capabilities. **Run each of these to understand how workflows work before attempting the exercises.**

#### Example 1: Hello World Workflow

The simplest workflow - run a single container.

Create a file `hello-world.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: hello-world-
spec:
  entrypoint: hello
  serviceAccountName: argo-admin
  templates:
  - name: hello
    container:
      image: busybox
      command: [echo]
      args: ["Hello World from Argo Workflows!"]
```

We notice the following:
- `generateName` creates a unique workflow name
- `entrypoint` specifies which template to start with
- The workflow runs a single container

Submit the workflow:

```shell-session
$ argo submit -n argo hello-world.yaml --watch
Name:                hello-world-xxxxx
Namespace:           argo
ServiceAccount:      unset
Status:              Succeeded
Created:             Mon Jan 01 12:00:00 +0000 (10 seconds ago)
Started:             Mon Jan 01 12:00:00 +0000 (10 seconds ago)
Finished:            Mon Jan 01 12:00:05 +0000 (5 seconds ago)
Duration:            5 seconds

STEP                  TEMPLATE  PODNAME             DURATION  MESSAGE
 ✔ hello-world-xxxxx  hello     hello-world-xxxxx   3s
```

View the logs:

```shell-session
$ argo logs -n argo hello-world-xxxxx
hello-world-xxxxx: Hello World from Argo Workflows!
```

We see that there was a mod that ran in the argo namespace:
```shell-session
student@lab-jobs:~$ kubectl get pods -n argo
NAME                                   READY   STATUS      RESTARTS   AGE
argo-server-5549677b6-f5hm6            1/1     Running     0          4m47s
hello-world-x8m96                      0/2     Completed   0          66s
httpbin-f5ccc9c6-t47d6                 1/1     Running     0          4m47s
minio-5877d79784-zph9x                 1/1     Running     0          4m47s
workflow-controller-7df5f5d5c8-qj8vd   1/1     Running     0          4m47s
```

#### Example 2: Sequential Multi-Step Workflow

Run multiple steps in sequence, passing parameters between them.

Create `sequential-steps.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: sequential-
spec:
  entrypoint: main
  serviceAccountName: argo-admin
  templates:
  - name: main
    steps:
    - - name: step1
        template: print-message
        arguments:
          parameters:
          - name: message
            value: "Step 1: Starting workflow"

    - - name: step2
        template: print-message
        arguments:
          parameters:
          - name: message
            value: "Step 2: Processing data"

    - - name: step3
        template: print-message
        arguments:
          parameters:
          - name: message
            value: "Step 3: Workflow complete"

  - name: print-message
    inputs:
      parameters:
      - name: message
    container:
      image: busybox
      command: [sh, -c]
      args: ["echo '{{inputs.parameters.message}}' && date"]
```

We see that we have defined a template for a container. This receives a parameter called `message` and runs a container to print it. We then devine three steps that run the `print-message` template.

Notice the following:
- `steps` template defines sequential execution
- Each step is an array `- -` (double dash)
- Parameters are passed to templates via `arguments`
- The `{{inputs.parameters.message}}` syntax accesses parameters

Submit and watch:

```shell-session
$ argo submit -n argo sequential-steps.yaml --watch
STEP                      TEMPLATE       PODNAME                 DURATION
 ✔ sequential-xxxxx       main
 ├─✔ step1                print-message  sequential-xxxxx-step1  5s
 ├─✔ step2                print-message  sequential-xxxxx-step2  4s
 └─✔ step3                print-message  sequential-xxxxx-step3  4s
```

We see the logs where each step prints the message:
```shell-session
student@lab-jobs:~$ argo logs -n argo sequential-fq6mr
sequential-fq6mr-print-message-1642373302: time="2026-05-12T19:38:56.328Z" level=info msg="capturing logs" argo=true
sequential-fq6mr-print-message-1642373302: Step 1: Starting workflow
sequential-fq6mr-print-message-1642373302: Tue May 12 19:38:56 UTC 2026
sequential-fq6mr-print-message-1642373302: time="2026-05-12T19:38:57.329Z" level=info msg="sub-process exited" argo=true error="<nil>"
sequential-fq6mr-print-message-700546422: time="2026-05-12T19:39:06.138Z" level=info msg="capturing logs" argo=true
sequential-fq6mr-print-message-700546422: Step 2: Processing data
sequential-fq6mr-print-message-700546422: Tue May 12 19:39:06 UTC 2026
sequential-fq6mr-print-message-700546422: time="2026-05-12T19:39:07.139Z" level=info msg="sub-process exited" argo=true error="<nil>"
sequential-fq6mr-print-message-1865731698: time="2026-05-12T19:39:16.157Z" level=info msg="capturing logs" argo=true
sequential-fq6mr-print-message-1865731698: Step 3: Workflow complete
sequential-fq6mr-print-message-1865731698: Tue May 12 19:39:16 UTC 2026
sequential-fq6mr-print-message-1865731698: time="2026-05-12T19:39:17.158Z" level=info msg="sub-process exited" argo=true error="<nil>"
```


#### Example 3: Parallel Execution

Run multiple tasks simultaneously and wait for all to complete.

Create `parallel-tasks.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: parallel-
spec:
  entrypoint: main
  serviceAccountName: argo-admin
  templates:
  - name: main
    steps:
    # All three tasks run in parallel (single dash means parallel)
    - - name: task-a
        template: process-task
        arguments:
          parameters:
          - name: task-name
            value: "Task A"
          - name: duration
            value: "10"

      - name: task-b
        template: process-task
        arguments:
          parameters:
          - name: task-name
            value: "Task B"
          - name: duration
            value: "15"

      - name: task-c
        template: process-task
        arguments:
          parameters:
          - name: task-name
            value: "Task C"
          - name: duration
            value: "12"

    # This step runs after all parallel tasks complete
    - - name: summary
        template: print-message
        arguments:
          parameters:
          - name: message
            value: "All parallel tasks completed!"

  - name: process-task
    inputs:
      parameters:
      - name: task-name
      - name: duration
    container:
      image: busybox
      command: [sh, -c]
      args: ["echo 'Processing {{inputs.parameters.task-name}}'; sleep {{inputs.parameters.duration}}; echo '{{inputs.parameters.task-name}} done'"]

  - name: print-message
    inputs:
      parameters:
      - name: message
    container:
      image: busybox
      command: [echo]
      args: ["{{inputs.parameters.message}}"]
```

Notice the following:
- Single dash `- name:` (within one `- -` block) means parallel execution
- All three tasks start simultaneously
- The `summary` step waits for all parallel tasks to complete

We'll notice the tasks run in parallel when we watch them run:

```shell-session
$ argo submit -n argo parallel-tasks.yaml --watch
STEP                    TEMPLATE      PODNAME               DURATION
 ✔ parallel-xxxxx       main
 ├─✔ task-a             process-task  parallel-xxxxx-taska  12s
 ├─✔ task-b             process-task  parallel-xxxxx-taskb  17s
 ├─✔ task-c             process-task  parallel-xxxxx-taskc  14s
 └─✔ summary            print-message parallel-xxxxx-sum    2s
```

Let's look at the logs:
```shell-session
student@lab-jobs:~$ argo logs -n argo parallel-724fr
parallel-724fr-process-task-2419718903: time="2026-05-12T19:50:11.579Z" level=info msg="capturing logs" argo=true
parallel-724fr-process-task-2419718903: Processing Task A
parallel-724fr-process-task-2453274141: time="2026-05-12T19:50:12.332Z" level=info msg="capturing logs" argo=true
parallel-724fr-process-task-2453274141: Processing Task C
parallel-724fr-process-task-2436496522: time="2026-05-12T19:50:13.059Z" level=info msg="capturing logs" argo=true
parallel-724fr-process-task-2436496522: Processing Task B
parallel-724fr-process-task-2419718903: Task A done
parallel-724fr-process-task-2419718903: time="2026-05-12T19:50:22.581Z" level=info msg="sub-process exited" argo=true error="<nil>"
parallel-724fr-process-task-2453274141: Task C done
parallel-724fr-process-task-2453274141: time="2026-05-12T19:50:24.338Z" level=info msg="sub-process exited" argo=true error="<nil>"
parallel-724fr-process-task-2436496522: Task B done
parallel-724fr-process-task-2436496522: time="2026-05-12T19:50:28.066Z" level=info msg="sub-process exited" argo=true error="<nil>"
parallel-724fr-print-message-2792551925: time="2026-05-12T19:50:40.653Z" level=info msg="capturing logs" argo=true
parallel-724fr-print-message-2792551925: All parallel tasks completed!
parallel-724fr-print-message-2792551925: time="2026-05-12T19:50:41.654Z" level=info msg="sub-process exited" argo=true error="<nil>"
```

#### Example 4: Passing Artifacts (Files) Between Steps

Generate a file in one step and consume it in another.

Create `artifact-passing.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: artifact-passing-
spec:
  entrypoint: main
  serviceAccountName: argo-admin
  templates:
  - name: main
    steps:
    - - name: generate-data
        template: generate-artifact

    - - name: process-data
        template: process-artifact
        arguments:
          artifacts:
          - name: input-file
            from: "{{steps.generate-data.outputs.artifacts.result}}"

    - - name: analyze-data
        template: analyze-artifact
        arguments:
          artifacts:
          - name: input-file
            from: "{{steps.process-data.outputs.artifacts.result}}"

  - name: generate-artifact
    container:
      image: busybox
      command: [sh, -c]
      args:
        - |
          echo "Generating data at $(date)" > /tmp/data.txt
          echo "Line 1: Sample data" >> /tmp/data.txt
          echo "Line 2: More data" >> /tmp/data.txt
          echo "Line 3: Final data" >> /tmp/data.txt
          cat /tmp/data.txt
    outputs:
      artifacts:
      - name: result
        path: /tmp/data.txt

  - name: process-artifact
    inputs:
      artifacts:
      - name: input-file
        path: /tmp/input.txt
    container:
      image: busybox
      command: [sh, -c]
      args:
        - |
          echo "Processing input file:"
          cat /tmp/input.txt
          echo "---"
          echo "Processed at $(date)" > /tmp/output.txt
          cat /tmp/input.txt | tr '[:lower:]' '[:upper:]' >> /tmp/output.txt
          cat /tmp/output.txt
    outputs:
      artifacts:
      - name: result
        path: /tmp/output.txt

  - name: analyze-artifact
    inputs:
      artifacts:
      - name: input-file
        path: /tmp/final.txt
    container:
      image: busybox
      command: [sh, -c]
      args:
        - |
          echo "Final analysis:"
          cat /tmp/final.txt
          echo "---"
          wc -l /tmp/final.txt
```

Notice the following points:
- `outputs.artifacts` defines files to pass to next steps
- `inputs.artifacts` defines where to receive files
- Argo automatically handles file transfer between steps
- Use `from: "{{steps.XXX.outputs.artifacts.YYY}}"`, where XXX is the step name and YYY is the artifact name, to reference artifacts
- Each step can read, transform, and output new artifacts

Submit and watch:

```shell-session
$ argo submit -n argo artifact-passing.yaml --watch
STEP                           TEMPLATE          PODNAME                      DURATION
 ✔ artifact-passing-xxxxx      main
 ├─✔ generate-data             generate-artifact artifact-passing-xxxxx-gen   5s
 ├─✔ process-data              process-artifact  artifact-passing-xxxxx-proc  4s
 └─✔ analyze-data              analyze-artifact  artifact-passing-xxxxx-anal  3s
```

View logs from the final step:

```shell-session
$ argo logs -n argo artifact-passing-j84t8 artifact-passing-j84t8-analyze-artifact-99164579
artifact-passing-j84t8-analyze-artifact-99164579: time="2026-05-12T20:01:28.155Z" level=info msg="capturing logs" argo=true
artifact-passing-j84t8-analyze-artifact-99164579: Final analysis:
artifact-passing-j84t8-analyze-artifact-99164579: Processed at Tue May 12 20:01:18 UTC 2026
artifact-passing-j84t8-analyze-artifact-99164579: GENERATING DATA AT TUE MAY 12 20:01:08 UTC 2026
artifact-passing-j84t8-analyze-artifact-99164579: LINE 1: SAMPLE DATA
artifact-passing-j84t8-analyze-artifact-99164579: LINE 2: MORE DATA
artifact-passing-j84t8-analyze-artifact-99164579: LINE 3: FINAL DATA
artifact-passing-j84t8-analyze-artifact-99164579: ---
artifact-passing-j84t8-analyze-artifact-99164579: 5 /tmp/final.txt
artifact-passing-j84t8-analyze-artifact-99164579: time="2026-05-12T20:01:29.156Z" level=info msg="sub-process exited" argo=true error="<nil>"
```

### Understanding Workflow Execution

When you submit a workflow:

1. **Workflow Controller** watches for new Workflow resources
2. **Scheduler** creates pods for each step based on dependencies
3. **Executor** runs containers and manages artifacts
4. **Outputs** are collected (parameters, artifacts)
5. **Next steps** are triggered based on dependencies
6. **Status** is updated continuously

You can monitor workflows using:

```shell-session
# List workflows
$ argo list -n argo
NAME                     STATUS      AGE   DURATION   PRIORITY   MESSAGE
artifact-passing-j84t8   Succeeded   15m   30s        0
parallel-724fr           Succeeded   26m   40s        0
sequential-fq6mr         Succeeded   37m   30s        0
hello-world-x8m96        Succeeded   39m   10s        0

# Get workflow details
$ argo get -n argo parallel-724fr
Name:                parallel-724fr
Namespace:           argo
ServiceAccount:      unset (will run with the default ServiceAccount)
Status:              Succeeded
Conditions:
 PodRunning          False
 Completed           True
Created:             Tue May 12 19:50:07 +0000 (27 minutes ago)
Started:             Tue May 12 19:50:07 +0000 (27 minutes ago)
Finished:            Tue May 12 19:50:47 +0000 (26 minutes ago)
Duration:            40 seconds
Progress:            4/4
ResourcesDuration:   1m6s*(100Mi memory),3s*(1 cpu)

STEP               TEMPLATE       PODNAME                                  DURATION  MESSAGE
 ✔ parallel-724fr  main
 ├─┬─✔ task-a      process-task   parallel-724fr-process-task-2419718903   15s
 │ ├─✔ task-b      process-task   parallel-724fr-process-task-2436496522   21s
 │ └─✔ task-c      process-task   parallel-724fr-process-task-2453274141   17s
 └───✔ summary     print-message  parallel-724fr-print-message-2792551925  4s


# Watch workflow execution
$ argo watch -n argo <workflow-name>

# View logs
$ argo logs -n argo parallel-724fr
parallel-724fr-process-task-2419718903: time="2026-05-12T19:50:11.579Z" level=info msg="capturing logs" argo=true
parallel-724fr-process-task-2419718903: Processing Task A
parallel-724fr-process-task-2453274141: time="2026-05-12T19:50:12.332Z" level=info msg="capturing logs" argo=true
parallel-724fr-process-task-2453274141: Processing Task C
parallel-724fr-process-task-2436496522: time="2026-05-12T19:50:13.059Z" level=info msg="capturing logs" argo=true
parallel-724fr-process-task-2436496522: Processing Task B
parallel-724fr-process-task-2419718903: Task A done
parallel-724fr-process-task-2419718903: time="2026-05-12T19:50:22.581Z" level=info msg="sub-process exited" argo=true error="<nil>"
parallel-724fr-process-task-2453274141: Task C done
parallel-724fr-process-task-2453274141: time="2026-05-12T19:50:24.338Z" level=info msg="sub-process exited" argo=true error="<nil>"
parallel-724fr-process-task-2436496522: Task B done
parallel-724fr-process-task-2436496522: time="2026-05-12T19:50:28.066Z" level=info msg="sub-process exited" argo=true error="<nil>"
parallel-724fr-print-message-2792551925: time="2026-05-12T19:50:40.653Z" level=info msg="capturing logs" argo=true
parallel-724fr-print-message-2792551925: All parallel tasks completed!
parallel-724fr-print-message-2792551925: time="2026-05-12T19:50:41.654Z" level=info msg="sub-process exited" argo=true error="<nil>"

# Delete workflow
$ argo delete -n argo parallel-724fr
```
