import { describe, expect, it } from 'vitest';
import { deriveArt, metalColor } from '../../src/lib/watchArt';
import { scriptSrc } from '../../src/lib/update';

const rolex = (model: string, reference: string, extra: Record<string, unknown> = {}, material = 'Oystersteel', dial = 'black') => ({
  brand_name: 'Rolex', model_name: model, reference, case_material: material, dial_color: dial, extras: extra,
});

describe('drawn dials', () => {
  it('draws gem-set bezels from the reference suffix', () => {
    const rainbow = deriveArt(rolex('Cosmograph Daytona', '116595RBOW', { bezel: 'Rainbow sapphire-set' }, '18k Everose gold', ''));
    expect(rainbow.bezel).toMatchObject({ kind: 'gems' });
    expect((rainbow.bezel as { colors: string[] }).colors.length).toBeGreaterThan(5);
    expect(deriveArt(rolex('Day-Date 40', '228348RBR', {}, '18k yellow gold', '')).bezel).toEqual({ kind: 'gems', colors: ['#f4f7fb'] });
    expect(deriveArt(rolex('Submariner Date', '116659SABR', { bezel: 'Sapphire-set' }, '18k white gold')).bezel).toMatchObject({ kind: 'gems' });
    expect(deriveArt(rolex('Day-Date 40', '228238', { bezel: 'Fluted' }, '18k yellow gold')).bezel).toEqual({ kind: 'fluted' });
  });

  it('draws GMT bezels from the reference code, night half on top', () => {
    const pepsi = deriveArt(rolex('GMT-Master II', '126710BLRO'));
    expect(pepsi.bezel).toEqual({ kind: 'gmt', top: '#1f3f7a', bottom: '#b3262e' });
    expect(pepsi.gmtHand).toBeTruthy();
    expect(pepsi.date).toBe(true);
    expect(deriveArt(rolex('GMT-Master II', '126710BLNR')).bezel).toMatchObject({ kind: 'gmt', bottom: '#141517' });
    expect(deriveArt(rolex('GMT-Master', '1675', { nickname: 'Pepsi' })).bezel).toMatchObject({ kind: 'gmt', bottom: '#b3262e' });
  });

  it('draws the Hulk green on green, and Submariners with a dive bezel', () => {
    const hulk = deriveArt(rolex('Submariner Date', '116610LV', { nickname: 'Hulk', bezel: 'Unidirectional, green Cerachrom' }, 'Oystersteel', 'green'));
    expect(hulk.bezel).toEqual({ kind: 'dive', color: '#1e6a3f' });
    expect(hulk.dial).toBe('#1e5a3a');
    const sub = deriveArt(rolex('Submariner', '124060'));
    expect(sub.bezel).toMatchObject({ kind: 'dive' });
    expect(sub.date).toBe(false);
  });

  it('handles fluted bezels, chronographs, Panda and shapes', () => {
    expect(deriveArt(rolex('Datejust 41', '126334', { bezel: 'Fluted, white gold', nickname: 'Wimbledon' }, 'White Rolesor')).bezel).toEqual({ kind: 'fluted' });
    const panda = deriveArt(rolex('Cosmograph Daytona', '126500LN', { nickname: 'Panda (white dial)', bezel: 'Black Cerachrom tachymeter' }, 'Oystersteel', ''));
    expect(panda.subdials).toBe(3);
    expect(panda.subdialColor).toBe('#141517');
    expect(panda.bezel).toMatchObject({ kind: 'tachy', color: '#141517' });
    expect(deriveArt({ brand_name: 'Cartier', model_name: 'Tank Must', reference: 'WSTA0041' }).shape).toBe('rect');
    expect(deriveArt({ brand_name: 'Cartier', model_name: 'Santos de Cartier', reference: 'WSSA0018' }).shape).toBe('square');
    expect(deriveArt({ brand_name: 'Audemars Piguet', model_name: 'Royal Oak Selfwinding', reference: '15510ST' }).shape).toBe('octagon');
  });

  it('picks case metal colours and readable markers', () => {
    expect(metalColor('18k yellow gold')).toBe('#d8b24c');
    expect(metalColor('18k Everose gold')).toBe('#d9a189');
    expect(metalColor('Black ceramic')).toBe('#2a2b2e');
    expect(deriveArt(rolex('Explorer II', '226570', { nickname: 'Polar (white dial)' }, 'Oystersteel', '')).ink).toBe('#1b1d20');
    expect(deriveArt(rolex('Explorer', '124270')).ink).toBe('#f3f2ee');
  });
});

describe('update check', () => {
  it('reads the app bundle path from index.html', () => {
    expect(scriptSrc('<script type="module" crossorigin src="/assets/index-AbC123.js"></script>')).toBe('/assets/index-AbC123.js');
    expect(scriptSrc('<html></html>')).toBeNull();
  });
});
