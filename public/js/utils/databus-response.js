var DatabusResponse = 
{
  // COLLECTIONS
  COLLECTION_CREATED : 2000,
  COLLECTION_UPDATED : 2001,
  COLLECTION_PUBLISHED : 2002,
  COLLECTION_UNPUBLISHED : 2003,
  COLLECTION_DELETED : 2004,
  COLLECTION_DRAFT_CREATED : 2006,
  COLLECTION_QUERY_COPIED_TO_CLIPBOARD: 2007,
  COLLECTION_LOCAL_CHANGES_DISCARDED: 2008,
  COLLECTION_DOWNLOAD_URLS_COPIED_TO_CLIPBOARD: 2009,
  COLLECTION_BASH_COPIED_TO_CLIPBOARD: 2010,
  COLLECTION_IMPORTED: 2011,

  COLLECTION_INVALID_ID : 4000,
  COLLECTION_UPDATE_ERROR : 4001,
  COLLECTION_BAD_REQUEST : 4002,

  COLLECTION_MISSING_LABEL : 4010,
  COLLECTION_INVALID_LABEL : 4011,
  COLLECTION_MISSING_DESCRIPTION : 4014,
  COLLECTION_INVALID_DESCRIPTION : 4015,
  COLLECTION_IMPORTED_FAILED: 4016,

  ACCOUNT_ALREADY_EXISTS : 4030,
  ACCOUNT_ACCESS_DENIED: 4031,
  ACCOUNT_INVALID_PERSON_IDENTIFIER: 4032,
  ACCOUNT_PERSON_GRAPH_MISSING: 4033
};

DatabusResponse.Message = 
{
  // COLLECTIONS
  2000 : "A new collection has been created.",
  2001 : "Your collection has been saved remotely.",
  2002 : "Your collection is now visible.",
  2003 : "Your collection is now hidden.",
  2004 : "Collection deleted.",
  2006 : "A new draft has been created",
  2007 : "The collection query has been copied to the clipboard",
  2008 : "Your local changes have been discarded.",
  2009 : "The collection download URLs have been copied to the clipboard",
  2010 : "The download script has been copied to the clipboard",
  2011 : "Collection imported successfully.",
  4000 : "Invalid collection id. Please use only lower case letters, numbers, underscores or dashes.",
  4001 : "Saving the collection failed. Please try again later.",
  4002 : "Failed to create the requested identifiers.",
  4010 : "The title field is required.",
  4011 : "Please enter at most 200 characters. The title should not contain any special characters except '(' and ')'.",
  4013 : "Please enter at least 50 and at most 500 characters.",
  4014 : "The description field is required",
  4015 : "Please enter at least 50 characters.",
  4030 : "An account with this name already exists",
  4031 : "You are not allowed to do that.",
  4032 : "The specified person identifier does not match the account",
  4033 : "No graph with person data found.",
  4016 : "Collection JSON import failed."
};

if(typeof module === "object" && module && module.exports)
   module.exports = DatabusResponse;