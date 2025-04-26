/* 
  sosotest.ts 
      A mediocre way to avoid supertest, avoiding super rely on super unnecessary 3rd party dependency
      for this usecase.   
          After deno's superdeno didn't worked at all (more details in the bottom of this file), I first
          wrote the first controller unit test using npm's supertest. After finishing the first file, I've
          noticed that the only function from it was the `request` one. After that, I've created this file
          to avoid importing a npm package and avoid a not really necessary npm module inside this deno 
          application. More details about this decision in the bottom of this file.
*/

interface ApiResponse {
  body?: {
    [key: string]: unknown;
    error?: {
      name?: string;
      message?: string;
    };
  };  
  headers?: {
    [key: string]: unknown;
    'set-cookie'?: string[];
  };
  
  status?: number;
}

interface ApiRequest {
  send: (body?: object) => Promise<ApiResponse>;
  set: (name: string, value: string[] | string) => ApiRequest;
}

interface Api {
  get: (path: string) => ApiRequest;
  post: (path: string) => ApiRequest;
  put: (path: string) => ApiRequest;
  delete: (path: string) => ApiRequest;
}

export function createApi(baseURL: string, PORT: number) {
  const host = "http://" + baseURL + ":" + PORT;
  const acceptedMethods = [
    'get',
    'post',
    'put',
    'delete'
  ];

  const api = {};
  acceptedMethods.forEach(method => {
    Object.assign(api, {
      [method]: apiCall.bind(null, method, host)
    });  
  });  

  return api as Api;

  function apiCall(method: string, host: string, path: string): ApiRequest {
    // currently working only for /path routes. /path/to/anything might fail
    // we can adjust it later, no need for now
    path = path.split('/').find(str => str !== '') as string;
    method = method.toUpperCase();
    
    const options: {
      headers: Record<string, string>;
      body?: string;
    } = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const requestObj: ApiRequest = {
      set(name: string, value: string[] | string): ApiRequest {
        if (Array.isArray(value)) {
          options.headers[name] = value.join('; ');
        }
        else {
          options.headers[name] = value;
        }
        return this;
      },
      
      async send(bodyValue: object = {}): Promise<ApiResponse> {
        const body = JSON.stringify(bodyValue);
        if (Object.keys(bodyValue).length > 0) {
          options.body = body;
        }
        
        const response = await fetch(`${host}/${path}`, {
          method: method.toUpperCase(),
          ...options,
        });

        const finalResponse = {
          status: response.status,
          headers: response.headers,
        } as unknown as ApiResponse;

        const rawBody = await response.text();
        if (rawBody.length > 0) {
          try {
            Object.assign(finalResponse, {
              body: JSON.parse(rawBody)
            });
          } catch (_) {
            Object.assign(finalResponse, {
              body: rawBody
            });
          }
        }

        const headersObj: ApiResponse["headers"] = {};

        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'set-cookie') {
            const cookieArray = value.split(/,(?=[^,]*=)/);
            headersObj[key.toLowerCase()] = cookieArray;
          } else {
            headersObj[key.toLowerCase()] = value;
          }
        });
        finalResponse.headers = headersObj;

        return finalResponse;
      }
    };

    return requestObj;
  }
}

/*
  DETAILS:
  I've tried to write these tests using superdeno package, but it seems to have
  an error that already have a pull request addressing it from a long time ago and
  no response. 

  1. For reference (issue and pull request links):
    - pull request: https://github.com/cmorten/superdeno/pull/45
    - issue: https://github.com/cmorten/superdeno/issues/46

  2. Error:
    ./src/modules/accounts/useCases/AuthenticateUser/tests/authenticateUserController_test.ts (uncaught error)
    error: (in promise) ReferenceError: window is not defined
        (window as any)[SHAM_SYMBOL].promises,
        ^
      at completeXhrPromises (https://deno.land/x/superdeno@4.9.0/src/test.ts:192:7)
      at https://deno.land/x/superdeno@4.9.0/src/test.ts:558:21
      at close (https://deno.land/x/superdeno@4.9.0/src/close.ts:47:52)

        info: window global is not available in Deno 2.
        hint: Replace `window` with `globalThis`.
    This error was not caught from a test and caused the test runner to fail on the referenced module.
    It most likely originated from a dangling promise, event/timeout handler or top-level code.

  3. Code excerpt that lead to the error (based on their docs):
    ```
      import { superdeno } from "https://deno.land/x/superdeno@4.9.0/mod.ts";
      (...)
      it('POST /login: should be able to authenticate an user', async () => {
        await superdeno(app)
          .post("/login")
          .set("Accept", "application/json")
          .send({
            email: userRequestData.email,
            password: userRequestData.password
          })
          .expect("Content-Type", /json/)
          .end((_err, response) => {
            const {
              body,
              status
            } = response;

            expect(status).toEqual(200);
            expect(body).toHaveProperty("token");
            expect(body).toHaveProperty("refresh_token");
            expect(body).toHaveProperty("user");
            expect(body.user.email).toEqual(userRequestData.email);
            expect(body.user.username).toEqual(userRequestData.username);
            expect(body.user.firstname).toEqual(userRequestData.firstName);
            expect(body.user.lastname).toEqual(userRequestData.lastName);
          })
      });
    ```
*/
