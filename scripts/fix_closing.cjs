const fs = require('fs');
let code = fs.readFileSync('src/app/pages/03-master/MasterAE.tsx', 'utf8');

const regex = /                  <\/div>\n                \)}\n              <\/div>\n            <\/div>\n          <\/div>\n        \)}\n      <\/div>\n    <\/div>\n  <\/div>\n<\/motion\.div>\n\)}\n<\/AnimatePresence>/m;
code = code.replace(regex, `                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
`);

// Now fix the end of the file.
const endRegex = /          <\/motion\.div>\n        \)}\n      <\/motion\.div>\n    \)}\n    {view === "upload" && \(/m;
code = code.replace(endRegex, `          </motion.div>
        )}
    {view === "upload" && (`);

// And wait, at the very end we had:
/*
        )}
      </AnimatePresence>
    </div>
  );
}
*/
// Since we removed AnimatePresence from the middle, it is correctly wrapping everything.
// Let's check how it works out.

fs.writeFileSync('src/app/pages/03-master/MasterAE.tsx', code);
