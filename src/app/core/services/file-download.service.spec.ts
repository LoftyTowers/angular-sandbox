import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FileDownloadService } from './file-download.service';

describe('FileDownloadService', () => {
  it('creates, clicks, and cleans up an anchor in browser mode', () => {
    TestBed.configureTestingModule({});

    const service = TestBed.inject(FileDownloadService);
    const doc = TestBed.inject(DOCUMENT);
    const fakeAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;

    const createElementSpy = vi.spyOn(doc, 'createElement').mockReturnValue(fakeAnchor);
    const appendChildSpy = vi.spyOn(doc.body, 'appendChild').mockReturnValue(fakeAnchor);
    const createObjectUrlSpy = vi
      .spyOn(doc.defaultView!.URL, 'createObjectURL')
      .mockReturnValue('blob:download');
    const revokeObjectUrlSpy = vi.spyOn(doc.defaultView!.URL, 'revokeObjectURL');

    service.downloadTextFile('logs.txt', '{"ok":true}', 'text/plain');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalledWith(fakeAnchor);
    expect(fakeAnchor.download).toBe('logs.txt');
    expect(fakeAnchor.href).toBe('blob:download');
    expect(fakeAnchor.click).toHaveBeenCalledTimes(1);
    expect(fakeAnchor.remove).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:download');
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
  });

  it('is a no-op outside browser mode', () => {
    const createElement = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: DOCUMENT,
          useValue: {
            createElement,
            body: null,
            defaultView: null,
          } as unknown as Document,
        },
      ],
    });

    const service = TestBed.inject(FileDownloadService);
    service.downloadTextFile('logs.txt', 'content');

    expect(createElement).not.toHaveBeenCalled();
  });
});
