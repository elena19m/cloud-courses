## Running Applications on OpenShift

### Connecting to OpenShift

OpenShift is Red Hat's container application platform that provides a secure and scalable foundation for building, deploying, and managing containerized applications.
It's a Kubernetes distribution with added features for enterprise use, including automated operations, developer workflows, and comprehensive security capabilities.
OpenShift extends Kubernetes with developer-focused tools that make it easier to manage applications throughout their lifecycle.

The UPB OpenShift deployment is at the following link: https://console-openshift-console.apps.ocp-demo.grid.pub.ro

On that page press the plus button to create a new project.

### Creatin a DevSpace

Access the DevSpaces dashboard and create a new workspace: https://devspaces.apps.ocp-demo.grid.pub.ro/dashboard/

This is the workspace in which you will be working continuing in this session.

In the workspace that you have created turn on the terminal usint the `alt+\`` command.

### Deploying Ollama on OpenShift

Use the following tutorial to deploy Ollama to OpenShift: https://gautam75.medium.com/deploy-ollama-and-open-webui-on-openshift-c88610d3b5c7

Make sure that the PVCs that you are creating use a maximum of 20GB per PVC. This is a limit imposed by available space in the working environment.

Instead of downloading all the models, download only the `llama3.2:3b` model so that we save on space.

Install the open webui.

After testing the openweb ui, download the DeepSeek R1 7b quantized model for ollama.
