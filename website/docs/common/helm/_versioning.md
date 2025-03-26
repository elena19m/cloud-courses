### Chart Versioning

Helm offers us the possibility to keep track of different varsions of our charts by using versioning.
The version of a chart is given by the parameter `version` found in the **Chart.yaml** file in the root of our chart.
Making use of the version we can upgrade charts or rollback to certain versions.

Let's start with the chart from the previous exercise.
Running `helm history [chart-deployment-name]` we will get to see the release history of our charts.

```shell-session
student@lab-helm:~/nginx-advanced$ helm history nginx-chart
REVISION        UPDATED                         STATUS          CHART                   APP VERSION     DESCRIPTION     
1               Thu Mar 20 20:39:39 2025        superseded      nginx-advance-0.1.0     1.16.0          Install complete
2               Thu Mar 20 20:46:27 2025        deployed        nginx-advance-0.2.0     1.16.0          Upgrade complete
```
In the **CHART** column we can see the version of the chart for each revision.
The **STATUS** column gives us information about what revision is currently deployed and what was the final status of the previous revisions.
The **DESCRIPTION** column gives additional information for each of the revisions.

To better make use of the versioning mechanism, let's start by updating the `version` parameter in the `Chart.yaml` file of our chart.

```shell-session
student@lab-helm:~/nginx-advanced$ cat Chart.yaml
apiVersion: v2
name: harder-chart
description: A Helm chart for Kubernetes

# A chart can be either an 'application' or a 'library' chart.
#
# Application charts are a collection of templates that can be packaged into versioned archives
# to be deployed.
#
# Library charts provide useful utilities or functions for the chart developer. They're included as
# a dependency of application charts to inject those utilities and functions into the rendering
# pipeline. Library charts do not define any templates and therefore cannot be deployed.
type: application

# This is the chart version. This version number should be incremented each time you make changes
# to the chart and its templates, including the app version.
# Versions are expected to follow Semantic Versioning (https://semver.org/)
version: 0.2.0

# This is the version number of the application being deployed. This version number should be
# incremented each time you make changes to the application. Versions are not expected to
# follow Semantic Versioning. They should reflect the version the application is using.
# It is recommended to use it with quotes.
appVersion: "1.16.0"
```

Once the version has been updated, let's update the `index.html` page by modifing its parameter value in `values.yaml`:

```shell-session
student@lab-helm:~/nginx-advance$ cat values.yaml
[...]
pageContent:
  indexPage: |
    <h1>This is the index.html page for version 0.2.0</h1>
[...]
```

Now let's upgrade the chart using `helm upgrade`:

```shell-session
student@lab-helm:~/nginx-advance$ helm upgrade nginx-chart .
student@lab-helm:~/nginx-advance$ helm history nginx-chart
REVISION        UPDATED                         STATUS          CHART                   APP VERSION     DESCRIPTION     
1               Thu Mar 20 20:39:39 2025        superseded      harder-chart-0.1.0      1.16.0          Install complete
2               Thu Mar 20 20:46:27 2025        superseded      harder-chart-0.2.0      1.16.0          Upgrade complete
3               Thu Mar 20 22:03:35 2025        deployed        harder-chart-0.2.0      1.16.0          Upgrade complete
```

We can see that the chart has been upgraded.
We can check this by accessing the page at **http://localhost:8080**.

Now let's rollback to a previous release. For this we will use `helm rollback`:

```shell-session
student@lab-helm:~/nginx-advance$ helm rollback nginx-chart
Rollback was a success! Happy Helming!
student@cc-lab-petre-dragos:~/harder-chart$ helm history nginx-chart
REVISION        UPDATED                         STATUS          CHART                   APP VERSION     DESCRIPTION     
1               Thu Mar 20 20:39:39 2025        superseded      harder-chart-0.1.0      1.16.0          Install complete
2               Thu Mar 20 20:46:27 2025        superseded      harder-chart-0.2.0      1.16.0          Upgrade complete
3               Thu Mar 20 22:03:35 2025        superseded      harder-chart-0.2.0      1.16.0          Upgrade complete
4               Thu Mar 20 22:09:29 2025        deployed        harder-chart-0.2.0      1.16.0          Rollback to 2
```
As we can see, we have rolled-back to REVISION 2, as described in the DESCRIPTION column.
Let's check this by accessing the `index.html` page as well: **http://localhost:8080**.

:::note
Do not forget to export `POD_NAME` and `CONTAINER_PORT` again, as before!
:::

We can see that we have the previous version of the page now.

:::note
`helm rollback nginx-chart` or `helm rollback nginx-chart 0` will rollback to the previous REVISION.
If you want to rollback to a specific revision, do: `helm rollback nginx-chart [REVISION_NUMBER]`
:::
