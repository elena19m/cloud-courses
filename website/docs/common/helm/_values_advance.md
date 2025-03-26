### Values - Advanced

Now that we saw how values work, it is time to dig a bit deeper into their strengths.
Making use of values, we can impose conditions in our templates.
Conditions can help us isolate parts of our deployements based on our requirements.
Moreover, Helm charts give us the posibility to use loops, leading to easier templating of repetitive parts for our deployments.

#### Conditions

Let's return to our chart from before:

```shell-session
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

Now, let's begin by adding a condition displaying a special additional message if it is the weekend:

```shell-session
student@lab-helm:~/my-chart/templates$ cat config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
data:
  message: {{ .Values.message }}
  {{- if .Values.weekend.enabled }}
  specialMessage: "Special deal for fruit tarts!"
  {{- end }}
  drink: {{ .Values.favoriteDrink }}
  desert: {{ .Values.favoriteDesert }}
```

Now we have to define the default value for the new parameter in `values.yaml`.

```shell-session
student@lab-helm:~/my-chart$ cat values.yaml

[...]

# Added value
weekend:
  enabled: false

message: "Hello, dear customer!"

favoriteDrink: "Cola"

favoriteDesert: "Apple Pie"
```

If we test our chart now, we will see that nothing is changed from before:

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

But now let's set the value of `weekend.enabled` to `true`:

```shell-session
student@lab-helm:~$ helm install test ./my-chart --dry-run --debug --set weekend.enabled=true

[...]

---
# Source: my-chart/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
data:
  message: Hello, dear customer!
  specialMessage: "Special deal for fruit tarts!"
  drink: Cola
  desert: Apple Pie
---

[...]
```

We can see that the chart has loaded the `specialMessage` now.


#### Loops

Loops come in handy when we want to define templates where we require lots of variables, such as environment variables.
Using `range` we can simplify the template's design, keeping it cleaner and easier to read and write.

Let's extend the ConfigMap from our chart to make use of loops.

```shell-session
student@lab-helm:~/my-chart/templates$ cat config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
data:
  message: {{ .Values.message }}
  {{- if .Values.weekend.enabled }}
  specialMessage: "Special deal for fruit tarts!"
  {{- end }}
  drinksMenu:
    {{- range .Values.menu.drinks}}
    name: {{ .name }}
    price: {{ .price}}
    {{- end }}
  desertsMenu:
    {{- range .Values.menu.deserts}}
    name: {{ .name }}
    price: {{ .price }}
    {{- end }}
student@lab-helm:~/my-chart/templates$ cd .. && cat values.yaml

[...]

weekend:
  enabled: false

message: "Hello, dear customer!"

favoriteDrink: "Cola"

favoriteDesert: "Apple Pie"

menu:
  drinks:
    - name: "Cola"
      price: "5 lei"
    - name: "Tea"
      price: "15 lei"
    - name: "Coffee"
      price: "17 lei"
  deserts:
    - name: "Chocolate Cake"
      price: "25 lei"
    - name: "Cheese Cake"
      price: "26 lei"
```

We modified the ConfigMap, adding two loops to create a menu.
As the entries in each of the categories follow the same structure, we can add just the generic format and loop over the values given in `values.yaml` to create and fill new entries.
Deploying this chart, we will see that entries were created for each pair in the `drinks` and `deserts` categories:

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
  drinksMenu:
    name: Cola
    price: 5 lei
    name: Tea
    price: 15 lei
    name: Coffee
    price: 17 lei
  desertsMenu:
    name: Chocolate Cake
    price: 25 lei
    name: Cheese Cake
    price: 26 lei
---

[...]
```
