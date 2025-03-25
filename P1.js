function getSub(string) {
  function isPalindrome(string) {
      let l = 0,
          r = string.length - 1;

      if (!string) return false;
      while (l < r) {
          if (string[l] !== string[r]) return false;
          l++; r--;
      }
      return true;
  }
  function sub([character, ...rest], right = '') {
      if (isPalindrome(right) && !result.includes(right)) result.push(right);
      if (!character) return;
      sub(rest, right + character);
      sub(rest, right);
  }

  var result = [];
  sub([...string])
  return result;
}

console.log(getSub('abba'));