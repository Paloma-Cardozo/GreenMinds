export function asyncHandler(routeHandler) {
  return function (req, res, next) {
    Promise.resolve(routeHandler(req, res, next)).catch(next);
  };
}
