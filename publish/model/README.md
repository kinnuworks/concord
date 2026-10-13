---
license: other
license_name: flux-1-dev-non-commercial-license
license_link: https://huggingface.co/black-forest-labs/FLUX.1-dev/blob/main/LICENSE.md
base_model: black-forest-labs/FLUX.1-dev
tags:
  - lora
  - flux
  - text-to-image
  - pictogram
  - healthcare
instance_prompt: rdbk pictogram
---

# Concord pictogram adapter for FLUX.1 [dev]

A LoRA style adapter that makes FLUX.1 [dev] draw flat, outlined pictograms in one consistent look. It was trained for [Concord](https://concord-health.vercel.app), which turns a hospital discharge sheet into picture cards and checks every generated picture by read-back before a patient sees it.

- **Base model:** FLUX.1 [dev]
- **Trigger phrase:** `rdbk pictogram`
- **Training set:** 70 [OpenMoji](https://openmoji.org) pictograms with written captions (CC BY-SA 4.0)
- **Training:** 1,000 steps, learning rate 0.0005, style mode, 218 seconds on fal
- **Code and evaluation:** https://github.com/kinnuworks/concord
- **Checked medicine names in 69 languages:** https://huggingface.co/datasets/heykinnu/concord-medicine-names

## What it changes

The plain model returns a different drawing style for almost every picture. Two vision models labelled the style of 270 pictures drawn without the adapter and 270 drawn with it.

| | Pictures both readers called a flat outlined pictogram |
|---|---|
| FLUX.1 [dev] alone | 56 of 270 (21%) |
| With this adapter | 210 of 270 (78%) |

This figure is about drawing style. In Concord, meaning is checked separately: two vision models describe each picture with no hint, and a picture they misread is thrown away.

## Use

```python
import torch
from diffusers import FluxPipeline

pipe = FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-dev", torch_dtype=torch.bfloat16)
pipe.load_lora_weights("heykinnu/concord-pictogram-lora", weight_name="concord-pictogram-lora.safetensors")
image = pipe("rdbk pictogram, one red and white capsule, alone in the middle of the picture, plain white background").images[0]
```

Prompts that work best name one object, say it is alone in the middle of the picture, and ask for a plain white background.

## Limits

The adapter sets style only. Like the base model, it miscounts: asked to draw a whole dose in one picture, FLUX.1 [dev] drew the wrong number of pills in 83 of 168 pictures. Concord asks for one unit, checks that it is exactly one, and repeats it in code.

## Licence

The adapter is a derivative of FLUX.1 [dev] and is covered by the FLUX.1 [dev] Non-Commercial License. The training images come from OpenMoji, CC BY-SA 4.0.
