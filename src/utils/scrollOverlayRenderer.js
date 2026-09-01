const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const withAlpha = (hexColor, alpha) => {
  const safe = /^#[0-9a-f]{6}$/i.test(hexColor || '') ? hexColor : '#000000';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
};

const measureText = (ctx, text, letterSpacing = 0) => {
  const spacing = number(letterSpacing);
  if (!spacing || !text || text.length <= 1) return ctx.measureText(text || '').width;
  return ctx.measureText(text).width + spacing * (text.length - 1);
};

const drawText = (ctx, text, x, y, letterSpacing = 0, stroke = false) => {
  const spacing = number(letterSpacing);
  if (!spacing || !text || text.length <= 1) {
    if (stroke) ctx.strokeText(text, x, y);
    else ctx.fillText(text, x, y);
    return;
  }

  let cursorX = x;
  for (const char of text) {
    if (stroke) ctx.strokeText(char, cursorX, y);
    else ctx.fillText(char, cursorX, y);
    cursorX += ctx.measureText(char).width + spacing;
  }
};

const alignX = (ctx, text, boxX, boxW, align = 'center', letterSpacing = 0) => {
  const width = measureText(ctx, text, letterSpacing);
  if (align === 'left') return boxX;
  if (align === 'right') return boxX + boxW - width;
  return boxX + (boxW - width) / 2;
};

const roundRect = (ctx, x, y, w, h, r) => {
  const radius = clamp(number(r), 0, Math.min(Math.abs(w), Math.abs(h)) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

export const wrapText = (ctx, text, maxWidth, letterSpacing = 0) => {
  if (!text) return [];
  const lines = [];
  const paragraphs = String(text).split('\n');

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push('');
      return;
    }

    const segments = [];
    let buffer = '';
    for (const char of paragraph) {
      const isCjk = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef\u3040-\u30ff\uac00-\ud7af]/.test(char);
      if (isCjk) {
        if (buffer) segments.push(buffer);
        buffer = '';
        segments.push(char);
      } else {
        buffer += char;
        if (/\s/.test(char)) {
          segments.push(buffer);
          buffer = '';
        }
      }
    }
    if (buffer) segments.push(buffer);

    let line = '';
    segments.forEach((segment) => {
      const candidate = line + segment;
      if (measureText(ctx, candidate, letterSpacing) > maxWidth && line) {
        lines.push(line.trimEnd());
        line = '';
      }

      if (measureText(ctx, segment, letterSpacing) > maxWidth) {
        for (const char of segment) {
          const charCandidate = line + char;
          if (measureText(ctx, charCandidate, letterSpacing) > maxWidth && line) {
            lines.push(line.trimEnd());
            line = char;
          } else {
            line = charCandidate;
          }
        }
      } else {
        line = line ? line + segment : segment;
      }
    });

    if (line) lines.push(line.trimEnd());
  });

  return lines;
};

export const createScrollOverlay = (overrides = {}) => ({
  id: 'ov_scroll_main',
  type: 'scroll',
  scroll_title: '震惊！字幕神器支持纯前端了',
  content: '欢迎使用滚动字幕 Web 引擎！\n\n右侧面板可以实时吸取字幕特效。\n打开批量表格后，系统会把这里的效果作为模板底座，自动替换每一行文案。',
  x: 40,
  y: 350,
  w: 1000,
  h: 1220,
  start: 0,
  end: 15,
  fontsize: 55,
  font_family: 'Arial',
  font_weight: 700,
  color: '#FFFFFF',
  align: 'center',
  text_width: 900,
  line_spacing: 8,
  letter_spacing: 0,
  use_stroke: true,
  stroke_color: '#000000',
  stroke_width: 3,
  shadow_enabled: true,
  shadow_color: '#000000',
  shadow_opacity: 0.8,
  shadow_blur: 6,
  shadow_offset_x: 0,
  shadow_offset_y: 3,
  scroll_title_fixed: true,
  scroll_title_independent: false,
  scroll_title_fontsize: 56,
  scroll_title_font_family: '',
  scroll_title_font_weight: 900,
  scroll_title_color: '#FFE81F',
  scroll_title_gap: 20,
  scroll_title_shadow_enabled: true,
  scroll_speed: 0.8,
  scroll_from_x: 540,
  scroll_from_y: 1750,
  scroll_to_y: -260,
  scroll_offset_x: 0,
  scroll_offset_y: 0,
  scroll_static: false,
  scroll_auto_stop: true,
  scroll_auto_stop_lead: 0.5,
  feather_top: 200,
  feather_bottom: 200,
  feather_top_offset: 0,
  feather_bottom_offset: 0,
  bg_enabled: true,
  bg_color: '#000000',
  bg_opacity: 0.52,
  bg_radius: 18,
  bg_pt: 46,
  bg_pb: 46,
  bg_px: 22,
  ...overrides,
});

export const drawScrollOverlay = (ctx, overlay, currentTime, canvasW = 1080, canvasH = 1920) => {
  const ov = createScrollOverlay(overlay);
  const clipX = number(ov.x) + number(ov.scroll_offset_x);
  const clipY = number(ov.y) + number(ov.scroll_offset_y);
  const clipW = Math.max(1, number(ov.w, canvasW));
  const clipH = Math.max(1, number(ov.h, canvasH));
  const opacity = number(ov.opacity, 255) / 255;
  const fontSize = Math.max(8, number(ov.fontsize, 55));
  const textWidth = clamp(number(ov.text_width, clipW), 40, clipW);
  const textX = number(ov.scroll_from_x, canvasW / 2) + number(ov.scroll_offset_x);
  const textBoxX = textX - textWidth / 2;
  const lineHeight = fontSize * 1.3 + number(ov.line_spacing, 0);
  const letterSpacing = number(ov.letter_spacing, 0);

  ctx.save();
  ctx.globalAlpha = opacity;

  if (ov.bg_enabled) {
    ctx.save();
    ctx.fillStyle = withAlpha(ov.bg_color, number(ov.bg_opacity, 0.52));
    roundRect(
      ctx,
      clipX - number(ov.bg_px, 0),
      clipY - number(ov.bg_pt, 0),
      clipW + number(ov.bg_px, 0) * 2,
      clipH + number(ov.bg_pt, 0) + number(ov.bg_pb, 0),
      number(ov.bg_radius, 0),
    );
    ctx.fill();
    ctx.restore();
  }

  const layer = document.createElement('canvas');
  layer.width = clipW;
  layer.height = clipH;
  const layerCtx = layer.getContext('2d');
  layerCtx.textBaseline = 'top';
  layerCtx.textAlign = 'left';

  const titleFontSize = Math.max(8, number(ov.scroll_title_fontsize, 56));
  const titleFamily = ov.scroll_title_font_family || ov.font_family || 'Arial';
  const titleWeight = number(ov.scroll_title_font_weight, 900);
  let titleLines = [];
  let titleBlockH = 0;
  if (ov.scroll_title) {
    layerCtx.font = `${titleWeight} ${titleFontSize}px "${titleFamily}", sans-serif`;
    titleLines = wrapText(layerCtx, ov.scroll_title, clipW, letterSpacing);
    if (!ov.scroll_title_independent) {
      titleBlockH = titleLines.length * (titleFontSize * 1.2) + number(ov.scroll_title_gap, 0);
    }
  }

  const autoTitleOffset = ov.scroll_title && ov.scroll_title_fixed && !ov.scroll_title_independent ? titleBlockH : 0;
  const topOffset = number(ov.feather_top_offset) + autoTitleOffset;
  const bottomOffset = number(ov.feather_bottom_offset);

  layerCtx.font = `${number(ov.font_weight, 700)} ${fontSize}px "${ov.font_family || 'Arial'}", sans-serif`;
  const bodyText = ov.scroll_uppercase === true ? String(ov.content || '').toUpperCase() : String(ov.content || '');
  const lines = wrapText(layerCtx, bodyText, textWidth, letterSpacing);
  const duration = Math.max(0.1, number(ov.end, 15) - number(ov.start, 0));
  const progressBase = duration - number(ov.scroll_auto_stop_lead, 0.5);
  const progress = clamp((currentTime - number(ov.start, 0)) / Math.max(0.1, progressBase), 0, 1);
  const fromY = number(ov.scroll_from_y, 1750) + number(ov.scroll_offset_y);
  let toY = number(ov.scroll_to_y, -260) + number(ov.scroll_offset_y);

  if (ov.scroll_auto_stop) {
    const visibleBodyH = clipH - number(ov.feather_top) - number(ov.feather_bottom) - topOffset - bottomOffset;
    const totalTextH = lines.length * lineHeight;
    if (fromY > toY) {
      toY = totalTextH <= visibleBodyH
        ? clipY + topOffset + number(ov.feather_top)
        : clipY + clipH - bottomOffset - number(ov.feather_bottom) - totalTextH;
    }
  }

  const bodyY = ov.scroll_static
    ? clipY + topOffset + number(ov.feather_top)
    : fromY + (toY - fromY) * progress * number(ov.scroll_speed, 1);

  const drawBodyLines = (targetCtx, stroke = false) => {
    let y = bodyY - clipY + (ov.scroll_title && !ov.scroll_title_fixed ? titleBlockH : 0);
    for (const line of lines) {
      const x = alignX(targetCtx, line, textBoxX - clipX, textWidth, ov.align, letterSpacing);
      drawText(targetCtx, line, x, y, letterSpacing, stroke);
      y += lineHeight;
    }
  };

  layerCtx.save();
  layerCtx.font = `${number(ov.font_weight, 700)} ${fontSize}px "${ov.font_family || 'Arial'}", sans-serif`;
  if (ov.shadow_enabled) {
    layerCtx.shadowColor = withAlpha(ov.shadow_color, number(ov.shadow_opacity, 0.8));
    layerCtx.shadowBlur = number(ov.shadow_blur, 6);
    layerCtx.shadowOffsetX = number(ov.shadow_offset_x, 0);
    layerCtx.shadowOffsetY = number(ov.shadow_offset_y, 3);
  }
  layerCtx.fillStyle = ov.color || '#FFFFFF';
  if (ov.use_stroke && number(ov.stroke_width) > 0) {
    layerCtx.strokeStyle = ov.stroke_color || '#000000';
    layerCtx.lineWidth = number(ov.stroke_width, 3) * 2;
    layerCtx.lineJoin = 'round';
    drawBodyLines(layerCtx, true);
  }
  drawBodyLines(layerCtx, false);
  layerCtx.restore();

  if (ov.scroll_title && ov.scroll_title_fixed === false) {
    layerCtx.save();
    layerCtx.font = `${titleWeight} ${titleFontSize}px "${titleFamily}", sans-serif`;
    if (ov.scroll_title_shadow_enabled) {
      layerCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      layerCtx.shadowBlur = 8;
      layerCtx.shadowOffsetY = 4;
    }
    layerCtx.fillStyle = ov.scroll_title_color || ov.color || '#FFFFFF';
    layerCtx.strokeStyle = ov.scroll_title_stroke_color || '#000000';
    layerCtx.lineWidth = Math.max(0, number(ov.scroll_title_stroke_width, 4));
    let y = bodyY - clipY;
    for (const line of titleLines) {
      const x = alignX(layerCtx, line, 0, clipW, ov.scroll_title_align || ov.align, letterSpacing);
      if (layerCtx.lineWidth > 0) drawText(layerCtx, line, x, y, letterSpacing, true);
      drawText(layerCtx, line, x, y, letterSpacing, false);
      y += titleFontSize * 1.2;
    }
    layerCtx.restore();
  }

  const featherTop = number(ov.feather_top);
  const featherBottom = number(ov.feather_bottom);
  if (featherTop > 0 || featherBottom > 0 || topOffset > 0 || bottomOffset > 0) {
    layerCtx.save();
    layerCtx.globalCompositeOperation = 'destination-in';
    const gradient = layerCtx.createLinearGradient(0, 0, 0, clipH);
    const s1 = clamp(topOffset / clipH, 0, 1);
    const s2 = clamp((topOffset + featherTop) / clipH, s1, 1);
    const s4 = clamp(1 - bottomOffset / clipH, 0, 1);
    const s3 = clamp(1 - (bottomOffset + featherBottom) / clipH, s2, s4);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    if (s1 > 0) gradient.addColorStop(s1, 'rgba(0,0,0,0)');
    if (s2 > s1) gradient.addColorStop(s2, 'rgba(0,0,0,1)');
    if (s3 > s2) gradient.addColorStop(s3, 'rgba(0,0,0,1)');
    if (s4 > s3) gradient.addColorStop(s4, 'rgba(0,0,0,0)');
    if (s4 < 1) gradient.addColorStop(1, 'rgba(0,0,0,0)');
    layerCtx.fillStyle = gradient;
    layerCtx.fillRect(0, 0, clipW, clipH);
    layerCtx.restore();
  }

  ctx.drawImage(layer, clipX, clipY);

  if (ov.scroll_title && ov.scroll_title_fixed !== false) {
    ctx.save();
    ctx.font = `${titleWeight} ${titleFontSize}px "${titleFamily}", sans-serif`;
    ctx.textBaseline = 'top';
    if (ov.scroll_title_shadow_enabled) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
    }
    ctx.fillStyle = ov.scroll_title_color || ov.color || '#FFFFFF';
    ctx.strokeStyle = ov.scroll_title_stroke_color || '#000000';
    ctx.lineWidth = number(ov.scroll_title_stroke_width, 4);
    const titleBoxX = ov.scroll_title_independent && ov.scroll_title_x != null
      ? number(ov.scroll_title_x) - clipW / 2
      : clipX;
    let y = ov.scroll_title_independent && ov.scroll_title_y != null
      ? number(ov.scroll_title_y)
      : clipY + number(ov.feather_top_offset);
    for (const line of titleLines) {
      const x = alignX(ctx, line, titleBoxX, clipW, ov.scroll_title_align || ov.align, letterSpacing);
      if (ctx.lineWidth > 0) drawText(ctx, line, x, y, letterSpacing, true);
      drawText(ctx, line, x, y, letterSpacing, false);
      y += titleFontSize * 1.2;
    }
    ctx.restore();
  }

  ctx.restore();
};
