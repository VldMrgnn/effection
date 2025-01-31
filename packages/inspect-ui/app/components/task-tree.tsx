import React, { useMemo, useCallback } from "react";
import { InspectState } from "@effection/inspect-utils";
import { TaskTreeItem } from "./task-tree-item";
import TreeView, { MultiSelectTreeViewProps } from "@material-ui/lab/TreeView";
import AddBoxOutlinedIcon from "@material-ui/icons/AddBoxOutlined";
import IndeterminateCheckBoxOutlinedIcon from "@material-ui/icons/IndeterminateCheckBoxOutlined";
import { useSettings } from "../hooks/use-settings";

export function TaskTree({
  task,
  collapsed = [],
  onToggle,
  basePath
}: {
  task: InspectState;
  basePath: string;

  /**
   * TreeView expects all nodes to be collapsed by default and expand only
   * items listed in expanded array. This is the oppositive of the behaviour
   * that we want for the Task Tree. The Task Tree will show all nodes unless
   * there are some that are explicitely collapsed.
   *
   * We introduce this behaviour by allowing a list of collapsed ids to be
   * passed as an array.
   */
  collapsed: string[];

  /**
   * When the user collapses or expands an item, we're going to persist the list
   * of collapsed items in the url. onToggle function expects to recieve a list of
   * ids to store. Look at docs for the collapsed parameter.
   */
  onToggle: (collapsed: string[]) => void;
}): JSX.Element {
  let ids = useMemo(() => {
    let result: string[] = [];
    function pushChild(child: InspectState) {
      result.push(`${child.id}`);
      if (child.yieldingTo) {
        pushChild(child.yieldingTo);
      }
      child.children.forEach(pushChild);
    }
    pushChild(task);
    return result;
  }, [task]);

  let expanded = useMemo(
    () => ids.filter((id) => !collapsed.includes(id)),
    [ids, collapsed]
  );

  let onNodeToggle: MultiSelectTreeViewProps["onNodeToggle"] = useCallback(
    (_event, expanded) => onToggle(ids.filter((id) => !expanded.includes(id))),
    [onToggle, ids]
  );

  let {
    settings: { showCompleted, showErrored, showHalted },
  } = useSettings();

  let childVisibilityFilter = useCallback(
    (child: InspectState) => {
      if (child.state === "completed" && !showCompleted) return false;
      if (child.state === "errored" && !showErrored) return false;
      if (child.state === "halted" && !showHalted) return false;
      return true;
    },
    [showCompleted, showErrored, showHalted]
  );

  return (
    <TreeView
      multiSelect
      expanded={expanded}
      defaultExpandIcon={<AddBoxOutlinedIcon />}
      defaultCollapseIcon={<IndeterminateCheckBoxOutlinedIcon />}
      onNodeToggle={onNodeToggle}
    >
      <TaskTreeItem task={task} childFilter={childVisibilityFilter} basePath={basePath} />
    </TreeView>
  );
}
