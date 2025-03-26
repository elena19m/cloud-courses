### Values

Charts offer the possibility to parameterize values inside their templates.
Values are a great way to customize charts and make them portable, allowing us to set different parameters with specific values that are used in our deployments.
We can find the parameters and their default values for each chart in the `values.yaml` file. 
We can pass values to charts in two ways: using `--set` during the `helm install` of a chart, or passing a file with the values using `helm install -f my-values.yaml`.

Let's start from a simple chart. We use `helm create` to create our own chart:

```shell-session
student@lab-helm:~$ helm create my-chart
Creating my-chart
```

We now have a chart created with all its files:

```shell-session
student@lab-helm:~$ tree my-chart/
my-chart/
├── charts                        # A directory containing any charts upon which this chart depends.
├── Chart.yaml                    # A YAML file containing information about the chart  
├── templates                     # A directory of templates that will generate valid Kubernetes manifest files.
│   ├── deployment.yaml           # The manifest of the deployment
│   ├── _helpers.tpl              # File containing helper function for setting different values for the template 
│   ├── hpa.yaml                  # Horizontal Pod Autoscaler
│   ├── ingress.yaml              # Ingress configuration
│   ├── NOTES.txt                 # Chart installation notes, displayed after a successfull installation to give the next steps
│   ├── serviceaccount.yaml       # The setup of a service account
│   ├── service.yaml              # The manifest of the service
│   └── tests                     # A directory containing tests for the chart  
│       └── test-connection.yaml
└── values.yaml                   # The default configuration values for this chart.

3 directories, 10 files
```

Now we will create a ConfigMap template in our chart templates:

```shell-session
student@lab-helm:~/my-chart/templates$ touch config.yaml
student@lab-helm:~/my-chart/templates$ cat config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
data:
  message: {{ .Values.message }}
  drink: {{ .Values.favoriteDrink }}
  desert: {{ .Values.favoriteDesert }}
```

We added three values in our template that we can configure. 
We now have to define default values for them in `values.yaml`:

```shell-session
student@lab-helm:~/my-chart$ cat values.yaml

[...]

# Additional volumeMounts on the output Deployment definition.
volumeMounts: []
# - name: foo
#   mountPath: "/etc/foo"
#   readOnly: true

nodeSelector: {}

tolerations: []

affinity: {}

message: "Hello, dear customer!"

favoriteDrink: "Cola"

favoriteDesert: "Apple Pie"
```

If we install this chart in debug mode we will see that the parameterize values in our template are replaced with the default ones:

```shell-session
student@lab-helm:~$ helm install test ./my-chart --dry-run --debug

[...]

---
# Source: my-chart/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
data:
  message: Hello, dear customer!
  drink: Cola
  desert: Apple Pie
---

[...]
```

We can use `--set` to manually set a parameter to a value that we want during install:

```shell-session
student@lab-helm:~$ helm install test ./my-chart --dry-run --debug --set favoriteDrink=tea --set favoriteDesert="fruit salad"

[...]

---
# Source: my-chart/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
data:
  message: Hello, dear customer!
  drink: tea
  desert: fruit salad
---

[...]
```

And lastly, we can use a custom values file for easier management of parameters:

```shell-session
student@lab-helm:~$ cat myvals.yaml
message: Hello from values file!
favoriteDrink: lemonade
favoriteDesert: chocolate mouse
student@lab-helm:~$ helm install test -f myvals.yaml ./my-chart --dry-run --debug

[...]

---
# Source: my-chart/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
data:
  message: Hello from values file!
  drink: lemonade
  desert: chocolate mouse
---

[...]
```
