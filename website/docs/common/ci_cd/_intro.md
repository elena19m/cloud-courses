## What is CI/CD?

CI/CD stands for *Continuous Integration* and *Continuous Deployment/Delivery*. It is a software engineering practice that automates the process of testing, building, and deploying applications. The end goal is to deliver code changes reliably to the end users.

With CI/CD, each code change goes through a consistent pipeline of automated steps such as linting, compiling, testing, and deployment, thus reducing human error and speeding up development cycles.

## Why do we need CI/CD?

CI/CD pipelines are useful to:
- detect errors early on with automated tests
- release new code versions to production in a stable, reliable manner
- reduce human errors during deployments
- quickly roll back to a stable version when needed

## What tools we will use?

In this lab, we'll use Github Actions to dive into the anatomy of a CI/CD pipeline and understand how it works. We'll also use ArgoCD to deploy our application to a Kubernetes cluster.

### GitHub Actions

[GitHub Actions](https://docs.github.com/en/actions/writing-workflows/quickstart) is an automation tool built into GitHub. It allows you to define custom pipelines directly in your repository using YAML configuration files.

### Argo CD

[Argo CD](https://argo-cd.readthedocs.io/en/stable/) - alongside the complementary tool [Argo Rollouts](https://argo-rollouts.readthedocs.io/en/stable/) - is a declarative, GitOps continuous delivery tool for Kubernetes. It allows you to manage your Kubernetes applications using Git repositories as the source of truth. With Argo CD, you can automate the deployment and management of your applications in a Kubernetes cluster.
