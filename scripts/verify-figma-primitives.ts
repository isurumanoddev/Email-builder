import { buildPrimitivesFromFigma } from '../src/lib/figma/figmaPrimitives';
import type { ParsedFigmaNode } from '../src/lib/figma/parseFigmaNode';
import type { ReactEmailNode } from '../src/lib/figma/types/reactEmailAst';

const btnPrimary: ParsedFigmaNode = {
  id: '133:297',
  type: 'INSTANCE',
  name: 'Button / Primary',
  width: 520,
  height: 52,
  visible: true,
  children: [
    {
      id: 'bg1',
      type: 'RECTANGLE',
      name: 'Fill',
      width: 520,
      height: 52,
      visible: true,
      backgroundColor: '#c3002f',
      cornerRadius: 26,
      children: [],
    },
    {
      id: 't1',
      type: 'TEXT',
      name: 'Label',
      width: 180,
      height: 18,
      visible: true,
      text: 'SEE ALL OFFERS →',
      fontSize: 14,
      fontWeight: 700,
      color: '#ffffff',
      children: [],
    },
  ],
};

const btnSecondary: ParsedFigmaNode = {
  id: '133:298',
  type: 'INSTANCE',
  name: 'Button / Secondary',
  width: 520,
  height: 52,
  visible: true,
  children: [
    {
      id: 'bg2',
      type: 'RECTANGLE',
      name: 'Fill',
      width: 520,
      height: 52,
      visible: true,
      backgroundColor: '#ffffff',
      cornerRadius: 26,
      children: [],
    },
    {
      id: 't2',
      type: 'TEXT',
      name: 'Label',
      width: 180,
      height: 18,
      visible: true,
      text: 'REQUEST A QUOTE',
      fontSize: 14,
      fontWeight: 700,
      color: '#000000',
      children: [],
    },
  ],
};

/** Matches real Nissan Figma: Opening → content frame + CTA frame (siblings) */
const openingRealStructure: ParsedFigmaNode = {
  id: '133:292',
  type: 'FRAME',
  name: 'Opening',
  width: 600,
  height: 520,
  visible: true,
  backgroundColor: '#000000',
  paddingTop: 40,
  paddingRight: 40,
  paddingBottom: 40,
  paddingLeft: 40,
  layoutMode: 'VERTICAL',
  counterAxisAlign: 'CENTER',
  gap: 24,
  children: [
    {
      id: '133:293',
      type: 'FRAME',
      name: 'Frame 48098941',
      width: 520,
      height: 344,
      visible: true,
      layoutMode: 'VERTICAL',
      counterAxisAlign: 'CENTER',
      gap: 16,
      exportUrl: '/images/uploads/figma-export-fd8edbd4.png',
      children: [
        {
          id: 'h1',
          type: 'TEXT',
          name: 'Header',
          width: 520,
          height: 80,
          visible: true,
          text: 'Exclusive offers for\nNissan owners',
          fontSize: 36,
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          children: [],
        },
        {
          id: 'body',
          type: 'TEXT',
          name: 'Body',
          width: 520,
          height: 200,
          visible: true,
          text: '<Name>, your April offers are waiting.\n\nNow\'s the time to go electric with ARIYA — secure 1% finance¹ across the range, and driveaway from $53,990³ on the 63kWh Engage variant.\n\nUnmissable offers below include the all-new Navara, MY26 X-TRAIL and MY26 QASHQAI.\n\nClick below to see all offers.',
          fontSize: 16,
          fontWeight: 400,
          color: '#ffffff',
          textAlign: 'center',
          children: [],
        },
      ],
    },
    {
      id: '133:296',
      type: 'FRAME',
      name: 'CTA',
      width: 520,
      height: 120,
      visible: true,
      layoutMode: 'VERTICAL',
      counterAxisAlign: 'CENTER',
      gap: 16,
      exportUrl: '/images/uploads/figma-export-db16312e.png',
      children: [btnPrimary, btnSecondary],
    },
  ],
};

/** CTA buttons with vectorized text (no TEXT nodes) */
const openingVectorButtons: ParsedFigmaNode = {
  ...openingRealStructure,
  children: [
    openingRealStructure.children[0],
    {
      ...openingRealStructure.children[1],
      children: [
        {
          ...btnPrimary,
          children: [
            {
              id: 'bg1',
              type: 'RECTANGLE',
              name: 'Fill',
              width: 520,
              height: 52,
              visible: true,
              backgroundColor: '#c3002f',
              cornerRadius: 26,
              children: [],
            },
          ],
        },
        {
          ...btnSecondary,
          children: [
            {
              id: 'bg2',
              type: 'RECTANGLE',
              name: 'Fill',
              width: 520,
              height: 52,
              visible: true,
              backgroundColor: '#ffffff',
              cornerRadius: 26,
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

function countTypes(tree: ReactEmailNode) {
  const types: string[] = [];
  function walk(n: ReactEmailNode) {
    types.push(n.type);
    if ('children' in n && Array.isArray(n.children)) n.children.forEach(walk);
  }
  walk(tree);
  return {
    buttons: types.filter((t) => t === 'Button').length,
    headings: types.filter((t) => t === 'Heading').length,
    texts: types.filter((t) => t === 'Text').length,
    imgs: types.filter((t) => t === 'Img').length,
  };
}

function run(label: string, node: ParsedFigmaNode) {
  const warnings: string[] = [];
  const tree = buildPrimitivesFromFigma(node, undefined, warnings);
  const { buttons, headings, texts, imgs } = countTypes(tree);
  const ok = buttons === 2 && headings === 1 && texts >= 4 && imgs === 0;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${label}: ${headings} Heading, ${texts} Text, ${buttons} Button, ${imgs} Img`
  );
  if (!ok) console.log('  warnings:', warnings);
  return ok;
}

const a = run('Real Figma structure (content + CTA sibling)', openingRealStructure);
const b = run('Vectorized button labels', openingVectorButtons);

process.exit(a && b ? 0 : 1);
