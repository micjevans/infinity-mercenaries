import React, { useRef, useEffect, useCallback } from "react";
import { Box, Button, useTheme, Chip } from "@mui/material";
import ExtensionIcon from "@mui/icons-material/Extension";
import { calculateLevel } from "../utils/experienceUtils";
import store from "../redux/store";
import { showNotification } from "../redux/notificationsSlice";

const perkTrees = {
  intelligence: [
    {
      id: 56,
      name: "Minelayer",
      lvl: 1,
      key: "skills",
      children: [
        {
          id: 56,
          key: "skills",
          name: "Minelayer (2)",
          extra: [267],
          lvl: 2,
        },
      ],
    },
    {
      id: 35,
      name: "Combat Jump",
      key: "skills",
      lvl: 2,
      children: [
        {
          id: 35,
          name: "Combat Jump (+3)",
          key: "skills",
          extra: [1],
          lvl: 3,
        },
        {
          id: 35,
          name: "Combat Jump (Explosion)",
          key: "skills",
          extra: [255],
          lvl: 4,
        },
      ],
    },
    {
      id: 161,
      name: 'Forward Deployment (+4")',
      key: "skills",
      extra: [26],
      lvl: 1,
      children: [
        {
          id: 161,
          name: 'Forward Deployment (+8")',
          key: "skills",
          extra: [22],
          lvl: 2,
          children: [
            {
              id: 47,
              name: "Infiltration",
              key: "skills",
              lvl: 3,
              children: [
                {
                  id: 47,
                  name: "Infiltration (+3)",
                  key: "skills",
                  lvl: 4,
                  extra: [1],
                },
              ],
            },
            {
              id: 249,
              name: "Impersonation",
              key: "skills",
              lvl: 4,
            },
          ],
        },
      ],
    },
    {
      id: 33,
      name: "Parachutist",
      key: "skills",
      lvl: 2,
      children: [
        {
          id: 33,
          name: "Parachutist (Dep. Zone)",
          key: "skills",
          extra: [48],
          lvl: 5,
        },
      ],
    },
    {
      id: "custom",
      name: "MOVE +0, +2",
      extra: [0, 5],
      key: "move",
      lvl: 3,
      children: [
        {
          id: "custom",
          name: "MOVE +2, +0",
          extra: [5, 0],
          operation: "ADD",
          key: "move",
          lvl: 4,
        },
      ],
    },
    {
      id: 89,
      name: "Sapper",
      key: "skills",
      lvl: 1,
    },
    {
      id: "Covering Fire (Deploys in Suppressive Fire State)",
      name: "Covering Fire",
      key: "skills",
      lvl: 3,
    },
  ],
};

// Helper to wrap text inside a given width
function measureWrappedText(ctx, text, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  let actualMaxWidth = 0;
  for (let i = 0; i < lines.length; i++) {
    const w = ctx.measureText(lines[i]).width;
    if (w > actualMaxWidth) actualMaxWidth = w;
  }
  const totalHeight = lines.length * lineHeight;
  return { lines, actualMaxWidth, totalHeight };
}

function drawCenteredWrappedText(
  ctx,
  text,
  centerX,
  centerY,
  maxWidth,
  lineHeight
) {
  const { lines, totalHeight } = measureWrappedText(
    ctx,
    text,
    maxWidth,
    lineHeight
  );
  const startY = centerY - totalHeight / 2 + lineHeight;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], centerX, startY + i * lineHeight);
  }
}

const PerkTree = ({ trooper, perk, setTrooper, onBack, perkPoints = 0 }) => {
  const theme = useTheme();
  const canvasRef = useRef(null);

  // Refs to hold current pan/zoom and layout info without causing React re-renders
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const treeDataRef = useRef(null);
  const initialPanZoomSetRef = useRef(false);
  const lastCanvasSizeRef = useRef({ width: 0, height: 0 });
  const staticBackgroundRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Returns the index of the perk in the trooper.perks array +1 if it's found
  // We want to do +1 so that we can also use it to check if the skill is found in the skills array
  function selectedPerkIndex(node, trooper) {
    // check if the perk is in the troopers perks
    const inPerksIndex = trooper.perks.findIndex(
      (perk) =>
        perk.id === node.id &&
        perk.key === node.key &&
        JSON.stringify(perk.extra) === JSON.stringify(node.extra) &&
        perk.weapons === node.weapons &&
        perk.equips === node.equips &&
        perk.peripherals === node.peripherals &&
        perk.skills === node.skills &&
        JSON.stringify(perk.move) === JSON.stringify(node.move) &&
        perk.cc === node.cc &&
        perk.bs === node.bs &&
        perk.wip === node.wip &&
        perk.ph === node.ph &&
        perk.arm === node.arm &&
        perk.bts === node.bts &&
        perk.w === node.w &&
        perk.s === node.s
    );
    return (
      inPerksIndex + 1 ||
      trooper.profileGroups[0].profiles[0].skills.some((skill) => {
        // confirm that the skill exists in the trooper's profile
        if (skill.id !== node.id) {
          // or that it's children do
          if (!node.children) return false;
          return node.children.some((child) =>
            selectedPerkIndex(child, trooper)
          );
        }
        // if the node has extras...
        if (node.extra) {
          // confirm that the skill has extras
          if (!skill.extra) return false;
          // confirm that every node extra is found in the skills extras
          const sameExtras = node.extra.every((nodeExtra) =>
            skill.extra.includes(nodeExtra)
          );
          if (sameExtras) return true;
          // or that it's children are valid
          if (!node.children) return false;
          return node.children.some((child) =>
            selectedPerkIndex(child, trooper)
          );
        }
        return true;
      })
    );
  }

  // Schedule a redraw using requestAnimationFrame
  const scheduleDraw = useCallback(() => {
    // Recursively draw nodes and connections
    function drawNode(ctx, node) {
      // First, recursively draw all children.
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => drawNode(ctx, child));
      }

      // Draw connection lines from this node to each child.
      const squareSize = 80;
      const halfSize = squareSize / 2;

      function getEdgePoint(center, target, halfSize) {
        const dx = target.x - center.x;
        const dy = target.y - center.y;
        if (dx === 0 && dy === 0) return { ...center };
        // Handle direct vertical/horizontal directions explicitly.
        if (dx === 0) {
          return { x: center.x, y: center.y + halfSize * Math.sign(dy) };
        }
        if (dy === 0) {
          return { x: center.x + halfSize * Math.sign(dx), y: center.y };
        }
        const t = Math.min(halfSize / Math.abs(dx), halfSize / Math.abs(dy));
        return { x: center.x + dx * t, y: center.y + dy * t };
      }

      if (node.children && node.children.length > 0) {
        ctx.save();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        node.children.forEach((child) => {
          const parentCenter = { x: node._x, y: node._y };
          const childCenter = { x: child._x, y: child._y };
          // Compute points on the edge of each square along the line connecting centers.
          const parentEdge = getEdgePoint(parentCenter, childCenter, halfSize);
          const childEdge = getEdgePoint(childCenter, parentCenter, halfSize);
          ctx.beginPath();
          ctx.moveTo(parentEdge.x, parentEdge.y);
          ctx.lineTo(childEdge.x, childEdge.y);
          ctx.stroke();
        });
        ctx.restore();
      }

      // Determine if this node is selected based on the trooper's skills.
      const selectedIndex = selectedPerkIndex(node, trooper); // 'trooper' must be in scope.

      // Draw the node square (fixed size).
      const cornerRadius = 8;
      const x = node._x - squareSize / 2;
      const y = node._y - squareSize / 2;
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + squareSize - cornerRadius, y);
      ctx.quadraticCurveTo(x + squareSize, y, x + squareSize, y + cornerRadius);
      ctx.lineTo(x + squareSize, y + squareSize - cornerRadius);
      ctx.quadraticCurveTo(
        x + squareSize,
        y + squareSize,
        x + squareSize - cornerRadius,
        y + squareSize
      );
      ctx.lineTo(x + cornerRadius, y + squareSize);
      ctx.quadraticCurveTo(x, y + squareSize, x, y + squareSize - cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
      ctx.closePath();

      // Fill style: solid orange if selected, else transparent with an orange outline.
      ctx.fillStyle = selectedIndex ? "orange" : "rgba(0, 0, 0, 0)";
      ctx.fill();

      ctx.strokeStyle = "orange";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw centered wrapped text on the node.
      // Use black text if selected, otherwise white.
      ctx.fillStyle = selectedIndex ? "black" : "#fff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      drawCenteredWrappedText(
        ctx,
        node.name,
        node._x,
        node._y,
        squareSize - 10,
        14
      );
    }
    // The main draw loop
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Create a cached offscreen background (gradient + grain)
      function createStaticBackground() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = canvas.width;
        const height = canvas.height;
        const offCanvas = document.createElement("canvas");
        offCanvas.width = width;
        offCanvas.height = height;
        const ctx = offCanvas.getContext("2d");
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, theme.palette.background.default);
        grad.addColorStop(1, "#000000");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        // Grain texture
        const grainSize = 100;
        const grainCanvas = document.createElement("canvas");
        grainCanvas.width = grainSize;
        grainCanvas.height = grainSize;
        const grainCtx = grainCanvas.getContext("2d");
        const imageData = grainCtx.createImageData(grainSize, grainSize);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const val = Math.random() * 255;
          imageData.data[i] = val;
          imageData.data[i + 1] = val;
          imageData.data[i + 2] = val;
          imageData.data[i + 3] = 30;
        }
        grainCtx.putImageData(imageData, 0, 0);
        const grainPattern = ctx.createPattern(grainCanvas, "repeat");
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, width, height);
        staticBackgroundRef.current = offCanvas;
      }

      // Compute the tree layout (positions of each node) and the initial pan/zoom
      function computeTreeLayoutAndPanZoom() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = canvas.width;
        const height = canvas.height;
        const maxLevel = 5;
        const horizontalSpacing = 150;
        const verticalSpacing = (height / (maxLevel + 1)) * 1.5;
        let currentX = -width / 2 + horizontalSpacing / 2;
        const computeY = (lvl) => {
          return (maxLevel - lvl - (maxLevel - 1) / 2) * verticalSpacing;
        };

        // Get the perk tree data (clone to avoid mutating the original)
        const treeData = (perkTrees[perk.toLowerCase()] || []).map((node) => ({
          ...node,
        }));

        function assignPositions(node) {
          node._y = computeY(node.lvl);
          if (!node.children || node.children.length === 0) {
            node._x = currentX;
            currentX += horizontalSpacing;
          } else {
            node.children.forEach(assignPositions);
            node._x =
              (node.children[0]._x +
                node.children[node.children.length - 1]._x) /
              2;
          }
        }
        treeData.forEach(assignPositions);

        // Compute bounding box for all nodes
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        function traverse(node) {
          if (node._x < minX) minX = node._x;
          if (node._x > maxX) maxX = node._x;
          if (node._y < minY) minY = node._y;
          if (node._y > maxY) maxY = node._y;
          if (node.children) {
            node.children.forEach(traverse);
          }
        }
        treeData.forEach(traverse);
        const margin = 40;
        const treeWidth = maxX - minX;
        const treeHeight = maxY - minY;
        const newScale =
          Math.min(
            width / (treeWidth + margin),
            height / (treeHeight + margin)
          ) * 0.95;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const leftMargin = 70;
        if (!initialPanZoomSetRef.current) {
          scaleRef.current = newScale;
          panOffsetRef.current = {
            x: -centerX * newScale + leftMargin,
            y: -centerY * newScale,
          };
          initialPanZoomSetRef.current = true;
        }
        treeDataRef.current = treeData;
      }

      // Check for canvas size changes and recalc layout/background as needed
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        lastCanvasSizeRef.current = { width: rect.width, height: rect.height };
        createStaticBackground();
        computeTreeLayoutAndPanZoom();
      }

      const ctx = canvas.getContext("2d");
      // Draw the cached static background if available
      if (staticBackgroundRef.current) {
        ctx.drawImage(staticBackgroundRef.current, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // Draw the tree with current pan/zoom
      ctx.save();
      ctx.translate(
        canvas.width / 2 + panOffsetRef.current.x,
        canvas.height / 2 + panOffsetRef.current.y
      );
      ctx.scale(scaleRef.current, scaleRef.current);
      if (treeDataRef.current) {
        treeDataRef.current.forEach((root) => {
          drawNode(ctx, root);
        });
      }
      ctx.restore();
      // Draw overlay dividers and level labels
      drawOverlay(ctx, canvas);
      animationFrameRef.current = null;
    }

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perk, theme.palette.background.default, trooper]);

  // Draw overlay lines and level labels (without transform)
  function drawOverlay(ctx, canvas) {
    const maxLevel = 5;
    const baseVerticalSpacing = (canvas.height / (maxLevel + 1)) * 1.5;
    const verticalOffset = canvas.height * -0.25;
    const staticComputeY = (lvl) =>
      (maxLevel - lvl - (maxLevel - 1) / 2) * baseVerticalSpacing +
      verticalOffset;
    const treeToCanvasY = (treeY) =>
      treeY * scaleRef.current + (canvas.height / 2 + panOffsetRef.current.y);
    ctx.save();
    ctx.shadowColor = "orange";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 3;
    for (let i = 0; i < maxLevel - 1; i++) {
      const avgTreeY = (staticComputeY(i) + staticComputeY(i + 1)) / 2;
      const yCanvas = treeToCanvasY(avgTreeY);
      ctx.beginPath();
      ctx.moveTo(0, yCanvas);
      ctx.lineTo(canvas.width, yCanvas);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "orange";
    ctx.font = "16px Arial";
    ctx.textBaseline = "middle";
    for (let i = 0; i < maxLevel; i++) {
      const yCanvas = treeToCanvasY(staticComputeY(i));
      ctx.fillText("Level " + (i + 1), 10, yCanvas);
    }
    ctx.restore();
  }

  // ----- Event Handlers -----

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    panOffsetRef.current.x += dx;
    panOffsetRef.current.y += dy;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    scheduleDraw();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  };

  // Hit-test for node clicks (inverting the pan/zoom transformation)
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    x = (x - (canvas.width / 2 + panOffsetRef.current.x)) / scaleRef.current;
    y = (y - (canvas.height / 2 + panOffsetRef.current.y)) / scaleRef.current;
    function findNodeAt(point, node) {
      const squareSize = 80;
      const half = squareSize / 2;
      if (
        point.x >= node._x - half &&
        point.x <= node._x + half &&
        point.y >= node._y - half &&
        point.y <= node._y + half
      ) {
        return node;
      }
      if (node.children) {
        for (let child of node.children) {
          const found = findNodeAt(point, child);
          if (found) return found;
        }
      }
      return null;
    }
    if (treeDataRef.current) {
      for (let root of treeDataRef.current) {
        const node = findNodeAt({ x, y }, root);

        // Perform Click Action
        if (node) {
          if (!perkPoints) {
            store.dispatch(showNotification("Not enough Perk Points", "error"));
            return null; // don't allow clicks if no perk points are available
          }
          if (calculateLevel(trooper.xp) < node.lvl) {
            store.dispatch(
              showNotification(`Trooper must be level ${node.lvl}`, "error")
            );
            return null; // don't allow clicks if the trooper is not high enough level for the perk
          }
          // if it's already selected, do nothing.
          if (selectedPerkIndex(node, trooper)) return null;

          function findParentById(baseNode, nodeToFind) {
            // If the current node doesn't have children, there's no parent to find here.
            if (!baseNode || !baseNode.children) return null;

            // Loop through each child of the current node.
            for (let child of baseNode.children) {
              // If the child's id matches the targetId, then the current node is its parent.
              if (child === nodeToFind) {
                return baseNode;
              }
              // Otherwise, recursively search in the child's subtree.
              const foundParent = findParentById(child, nodeToFind);
              if (foundParent) {
                return foundParent;
              }
            }

            // If no parent is found in the subtree, return null.
            return null;
          }

          // if the parent is not selected don't allow the click.
          const parent = perkTrees[perk.toLowerCase()]
            .map((treeNode) => findParentById(treeNode, node))
            .filter((e) => e !== null);

          if (parent.length > 0 && !selectedPerkIndex(parent[0], trooper)) {
            store.dispatch(
              showNotification(`Parent Perk must be selected first`, "error")
            );
            return null;
          }

          // otherwise, add the skill to the trooper.
          setTrooper((prevTrooper) => ({
            ...prevTrooper,
            perkPoints: prevTrooper.perkPoints - 1,
            perks: [
              ...prevTrooper.perks,
              {
                id: node.id,
                extra: node.extra,
                key: node.key,
                weapons: node.weapons,
                equips: node.equips,
                peripherals: node.peripherals,
                skills: node.skills,
                move: node.move,
                cc: node.cc,
                bs: node.bs,
                wip: node.wip,
                ph: node.ph,
                arm: node.arm,
                bts: node.bts,
                w: node.w,
                s: node.s,
              },
            ],
          }));
          break;
        }
      }
    }
  };

  // Attach the wheel listener with passive: false
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 0.1;
      if (e.deltaY < 0) {
        scaleRef.current += zoomFactor;
      } else if (e.deltaY > 0) {
        scaleRef.current -= zoomFactor;
      }
      scaleRef.current = Math.min(Math.max(scaleRef.current, 0.5), 3);
      scheduleDraw();
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [scheduleDraw]);

  // Initial draw (and recalc layout/background if "perk" or theme changes)
  useEffect(() => {
    scheduleDraw();
  }, [scheduleDraw, perk, theme]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <Button
        variant="outlined"
        onClick={onBack}
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 2,
        }}
      >
        Back
      </Button>

      {/* Add perk points display */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          // background: "rgba(0,0,0,0.7)",
          // px: 2,
          // py: 1,
          // borderRadius: 1,
        }}
      >
        <Chip
          icon={<ExtensionIcon />}
          label={`${perkPoints} Perk Points`}
          color={perkPoints > 0 ? "secondary" : "default"}
          variant={perkPoints > 0 ? "filled" : "outlined"}
        />
      </Box>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          border: `1px solid ${theme.palette.primary.main}`,
          cursor: "grab",
        }}
      />
    </Box>
  );
};

export default PerkTree;
