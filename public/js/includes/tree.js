class TreeNode {
  //value
  //parent node
  //child tree
  //siblings
  constructor(val) {
    this.val = val
    this.parent = null; //root
    this.child = null;
    this.sibling = null;
  }

  insertChild(child) {
    child.parent = this;
    child.sibling = this.child;
    this.child = child;
  }

  insertSibling(sibling) {
    if(this.parent != null) { //not root
      sibling.parent = this.parent;
      sibling.sibling = this.sibling;
      this.sibling = sibling;
    }
  }

  deleteChild() {
    if(this.child != null) {
      this.child = this.child.sibling;
    }
 }

 deleteSibling() {
   if(this.child != null) {
     this.sibling = this.sibling.sibling;
   }
 }

 get value() {
   return this.val;
 }

 get nextSibling() {
   return this.sibling;
 }

 get firstChild() {
   return this.child;
 }
}
