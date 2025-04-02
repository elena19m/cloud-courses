## Azure CLI

You are going to use the Azure cloud platform to deploy applications to a public cloud.

To interact with Azure, you will use the Azure CLI - a command-line tool that allows you to manage Azure resources and services from the command line.

The CLI command is:
```shell
student@cc-lab:~$ az
```

`az` is installed in the base virtual machine by running the setup script `lab-azure.sh`.
You can check the installation by running the following command in the terminal:
```shell
student@cc-lab:~$ az --version
```

:::note
If you want to install Azure CLI on your computers, follow the installation link from [here](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
:::

## Azure CLI - Login

To use the Azure CLI, you need to log in to your Azure account. You can do this by running the following command:
```shell
student@cc-lab:~$ az login
```
This will open a web browser where you can enter your Azure credentials. After logging in, you will see a list of your Azure subscriptions.

Hit Enter to select the default subscription and tenant.

```shell
student@cc-lab:~$ az login
To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code 1234567 to authenticate.

Retrieving tenants and subscriptions for the selection...

[Tenant and subscription selection]

No     Subscription name    Subscription ID                       Tenant
-----  -------------------  ------------------------------------  -----------------------------------
[1] *  Azure for Students   efe9e9a7-5898-47b0-9743-123456789012  Universitatea Politehnica Bucuresti

The default is marked with an *; the default tenant is 'Universitatea Politehnica Bucuresti' and subscription is 'Azure for Students' (efe9e9a7-5898-47b0-9743-123456789012 ).

Select a subscription and tenant (Type a number or Enter for no changes):

Tenant: Universitatea Politehnica Bucuresti
Subscription: Azure for Students (efe9e9a7-5898-47b0-9743-123456789012 )

If you encounter any problem, please open an issue at https://aka.ms/azclibug

[Warning] The login output has been updated. Please be aware that it no longer displays the full list of available subscriptions by default.
```

To list your tenants and subscriptions, you can use the following command:
```shell
student@cc-lab:~$ az account list
```

## Azure CLI - Help

To get help on the Azure CLI commands, you can use the `--help` option. For example, to get help on the `az login` command, you can run:
```shell
student@cc-lab:~$ az --help
student@cc-lab:~$ az account --help
```
