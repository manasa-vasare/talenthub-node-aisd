import { Request, Response } from 'express';
import { offerService } from '../services/offerService.js';
import path from 'path';

export async function issueOffer(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { application_id, package_lpa } = req.body;
    if (!application_id || !package_lpa) {
      res.status(400).json({ error: 'application_id and package_lpa are required.' });
      return;
    }

    const file = req.file;

    const offer = await offerService.issueOffer(
      {
        application_id: Number(application_id),
        package_lpa: Number(package_lpa),
        fileBuffer: file ? file.buffer : undefined,
        fileName: file ? file.originalname : undefined,
      },
      req.user
    );

    res.status(201).json(offer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function acceptOffer(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const appId = parseInt(req.params.applicationId as string, 10);
    const offer = await offerService.acceptOffer(appId, req.user);
    res.json({
      message: 'Offer accepted successfully! Placement recorded.',
      offer,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function downloadOfferLetter(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const key = req.params.key as string;
    const filePath = await offerService.getOfferLetterPath(key, req.user);

    const isInline = req.query.inline === 'true';
    if (isInline) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Offer_Letter_${key}"`);
      res.sendFile(path.resolve(filePath));
    } else {
      res.download(filePath, `Offer_Letter_${key}`, (err) => {
        if (err && !res.headersSent) {
          console.error('Download error:', err);
        }
      });
    }
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
}

