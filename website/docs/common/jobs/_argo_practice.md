## Argo Workflows Practice

Now that you've learned how Argo Workflows work by running the examples, it's time to build your own workflows! You'll create two multi-step workflows that demonstrate real-world batch processing scenarios.

:::important
In these exercises, you'll **create the Argo Workflow YAML** yourself. We provide ready-made containerized applications - your task is to orchestrate them using Argo Workflows.
:::

---

## Exercise 1: Image Processing Pipeline

### Objective

Create an Argo Workflow that orchestrates a multi-step image processing pipeline:
1. Download an image from a URL
2. Convert the image to black and white (grayscale)
3. Detect faces in the image and draw rectangles around them

### Your Task: Create the Workflow

You will start from the `image-processing.yaml` file bellow:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: image-processing-
spec:
  entrypoint: image-pipeline
  serviceAccountName: argo-admin
  templates:
  - name: image-pipeline
    steps:
    #TODO-1: Call the download-image template with the following parameter: https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg
    - - name: download
        template: download-image

    #TODO-2: Call the convert greyscale
    #- - name: grayscale
    #    template: convert-grayscale
    #    arguments:
    #TODO-2: Add input artifacts

    #TODO-3: Call the detect-faces template
    #- - name: detect
    #    template: detect-faces
    #TODO-3: Add input artifacts

  - name: download-image
    container:
    #TODO-1: Add container to download image from paramenter
    outputs:
      artifacts:
      - name: image
        path: /tmp/image.jpg

  #TODO-2: Uncomment the following lines
  #- name: convert-grayscale
  #  inputs:
  #TODO-2: Add correct inputs
  #  container:
  #    image: gitlab.cs.pub.ro:5050/scgc/cloud-courses/image-processor:latest
  #TODO-2: Call the application with the correct command and args
  #TODO-2: Add an output artifact that gets the grayscale output image

  #TODO-3: Uncomment the following lines
  #- name: detect-faces
  #  inputs:
  #TODO-3: Add input paths
  #  container:
  #    image: gitlab.cs.pub.ro:5050/scgc/cloud-courses/image-processor:latest
  #TODO-3: Call the application with the correct command and args
  #TODO-3: Add an output artifact that gets the grayscale output image
```

Use the `image-processing.yaml` file as a starting point to accomplish the
following:
1. Use the `gitlab.cs.pub.ro:5050/scgc/cloud-courses/image-processor:latest` container image. In it you can run the `app.py` application as such:
   - `app.py grayscale /tmp/input.jpg /tmp/gray.jpg` outputs a grayscale file in the `gray.jpg` file starting from the `input.jpg` file
   - `app.py detect-faces /tmp/input.jpg, /tmp/argo-results/result.jpg` outputs a file with a face detection algorithm applied
2. The workflow will run three steps based on three templates:
   - **download**: Downloads image from URL using operation "download"
   - **grayscale**: Converts image to grayscale using operation "grayscale"
   - **detect**: Detects faces using operation "detect-faces"
3. Pass the image file as an **artifact** between steps
4. Uses this test image URL: `https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg`

:::tip
Follow the TODOs marked in the file for a step-by-step implementation.
:::

:::info
- Review Example 4 (Artifact Passing) from the Argo Workflows guide
- Each template should use `container` with the image-processor image or busybox
- Use `command: [python, /app.py]` and `args: [...]` to specify the operation
- Remember to define `outputs.artifacts` to pass files to the next step
- Remember to define `inputs.artifacts` to receive files from the previous step
- You will be able to see the artifacts from the Argo UI dashboard to check on your work
:::

#### Phase 1: TODO-1

- The step is already created, you will have to design a container spec to
  download the input file and pass it as an artifact
- Follow Example 4 for Artifact Passing and use the `busybox` image to run
  `curl` inside a container
- Check that the output file for the curl matches the artifact path

#### Phase 2: TODO-2

- Uncomment the YAML lines
- Add inputs artifacts for the step
- Add inputs artifact paths for the pipeline
- Call the application with the correct parameters
- Add output artifact to the step template

#### Phase 3: TODO-3

- Uncomment the YAML lines
- Add inputs artifacts for the step
- Add inputs artifact paths for the pipeline
- Call the application with the correct parameters
- Add output artifact to the step template
- Download the image from the Argo dashboard

---

## Exercise 2: Web Scraping and Link Analysis

### Objective

Create an Argo Workflow that:
1. **Scrapes** two websites in parallel (Hacker News and Reddit)
2. **Aggregates** the scraped links and ranks them by frequency
3. Outputs the top 10 most frequently linked pages

### Your Task: Create the Workflow

Create an Argo Workflow file named `web-scraping.yaml` that:

We will be using a python application embedded in the image that works thusly:
- `app.py scrape <url> <output.json>` scrapes a url and saves the output to a json
- `app.py aggregate <links1.json> <links2.json> <aggregate.json>` aggregates the two jsons and counts the top linked pages


What you have to do:
1. Use the `gitlab.cs.pub.ro:5050/scgc/cloud-courses/web-scraper:latest` container image
2. Run two steps:
   - Phase 1 (parallel): Two tasks that scrape websites concurrently:
     - Scrape `https://news.ycombinator.com`
     - Scrape `https://old.reddit.com/r/programming`
   - Phase 2 (after phase 1 completes): One task that aggregates the results
3. Pass scraped links as artifacts (JSON files) between steps
4. The aggregate step receives both scraped link files and outputs a result

**Hints:**
- Review Example 3 (Parallel Execution) from the Argo Workflows guide
- Review Example 4 (Artifact Passing) from the Argo Workflows guide
- Use single dash for parallel steps: `- - name: scrape1` and `- name: scrape2` (both under one `- -`)
- Use double dash for the next sequential step: `- - name: aggregate`
- Remember that the aggregate operation takes 2 input files and 1 output file
