export function evaluateExpression(exprStr) {
  try {
    // Only allow numbers and basic operators to avoid any security issue
    if (!/^[0-9+\-*/() .]+$/.test(exprStr)) return NaN;
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${exprStr}`)();
    return result;
  } catch (e) {
    return NaN;
  }
}

// Generates permutations recursively
function getPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const perms = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const remainingPerms = getPermutations(remaining);
    for (const p of remainingPerms) {
      perms.push([current, ...p]);
    }
  }
  return perms;
}

// Generate all combinations of operators of a given length
function getOperatorCombinations(length) {
  if (length === 0) return [[]];
  const ops = ['+', '-', '*', '/'];
  if (length === 1) return ops.map(op => [op]);
  
  const combos = [];
  const smallerCombos = getOperatorCombinations(length - 1);
  for (const op of ops) {
    for (const sc of smallerCombos) {
      combos.push([op, ...sc]);
    }
  }
  return combos;
}

function hasSolution(digits) {
  const n = digits.length;
  // Deduplicate permutations to speed up
  const permSet = new Set();
  const perms = [];
  for (const p of getPermutations(digits)) {
    const key = p.join('');
    if (!permSet.has(key)) {
      permSet.add(key);
      perms.push(p);
    }
  }

  for (const perm of perms) {
    for (let i = 1; i < n; i++) {
      const lhsDigits = perm.slice(0, i);
      const rhsDigits = perm.slice(i);

      const lhsOpsCombos = getOperatorCombinations(lhsDigits.length - 1);
      const rhsOpsCombos = getOperatorCombinations(rhsDigits.length - 1);

      for (const lOps of lhsOpsCombos) {
        for (const rOps of rhsOpsCombos) {
          let lhsStr = `${lhsDigits[0]}`;
          for (let k = 0; k < lOps.length; k++) lhsStr += `${lOps[k]}${lhsDigits[k+1]}`;

          let rhsStr = `${rhsDigits[0]}`;
          for (let k = 0; k < rOps.length; k++) rhsStr += `${rOps[k]}${rhsDigits[k+1]}`;

          const leftVal = evaluateExpression(lhsStr);
          const rightVal = evaluateExpression(rhsStr);

          // Use floating point safe equality
          if (!isNaN(leftVal) && !isNaN(rightVal) && Math.abs(leftVal - rightVal) < 1e-6) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export function generatePuzzle(difficulty) {
  // Mapping difficulty to n digits
  const sizeMap = {
    easy: 4,
    medium: 5,
    hard: 6
  };
  const n = sizeMap[difficulty] || 4;

  let attempts = 0;
  while (true) {
    attempts++;
    // Use 1-9 to avoid easy x * 0 = 0 solutions that bypass logic
    const digits = Array.from({ length: n }, () => Math.floor(Math.random() * 9) + 1);
    
    // Fast path: simply verify
    if (hasSolution(digits)) {
      // Return a sorted copy as the raw "puzzle pieces"
      return [...digits].sort((a,b) => a-b);
    }

    if (attempts > 500) {
      // Fallback in case of insane bad luck, return a hardcoded solvable array based on N
      return difficulty === 'easy' ? [1,2,3,6] : difficulty === 'medium' ? [1,2,3,4,10].map(x=>x===10?2:x) : [1,1,2,2,3,3];
    }
  }
}

export function verifyUserExpression(exprArray, availableDigits) {
  // exprArray e.g. [7, '-', 4, '=', 6, '/', 2]
  // 1. Must contain exactly one '='
  const eqCount = exprArray.filter(x => x === '=').length;
  if (eqCount !== 1) {
    return { valid: false, message: "Expression must contain exactly one '='" };
  }

  // 2. Must use all available digits exactly once
  const usedDigits = exprArray.filter(x => typeof x === 'number');
  if (usedDigits.length !== availableDigits.length) {
    return { valid: false, message: "Must use all given numbers exactly once." };
  }
  
  const sortedUsed = [...usedDigits].sort((a,b)=>a-b);
  const sortedAvail = [...availableDigits].sort((a,b)=>a-b);
  for(let i=0; i<sortedAvail.length; i++) {
    if (sortedUsed[i] !== sortedAvail[i]) {
      return { valid: false, message: "Invalid numbers used." };
    }
  }

  // 3. Must be mathematically valid (e.g. L = R)
  const eqIndex = exprArray.indexOf('=');
  const lhs = exprArray.slice(0, eqIndex).join('');
  const rhs = exprArray.slice(eqIndex + 1).join('');

  // Protect against syntax errors like "++"
  try {
    const leftVal = evaluateExpression(lhs);
    const rightVal = evaluateExpression(rhs);

    if (isNaN(leftVal) || isNaN(rightVal)) {
      return { valid: false, message: "Incomplete math expression." };
    }

    if (Math.abs(leftVal - rightVal) < 1e-6) {
      return { valid: true, message: "Correct!" };
    } else {
      return { valid: false, message: "Mathematically incorrect." };
    }
  } catch(e) {
    return { valid: false, message: "Malformed expression." };
  }
}
